import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { HINTS } from "../src/results.js";
import { addImageShape, createOfferShape, listMyOffersShape, searchOffersShape, updateOfferShape } from "../src/schemas.js";

// The tools' inputs are written by hand to read well to a model, and mirror
// Vereel's public API definition. This test holds the two together: if Vereel
// changes a field, a limit, an enum value or an error code, the vendored copy
// is refreshed (`npm run sync-spec`) and this test names what to update.

/* eslint-disable @typescript-eslint/no-explicit-any */
const spec = JSON.parse(readFileSync(new URL("../spec/openapi.json", import.meta.url), "utf8"));
const schemas = spec.components.schemas;

/** Only what changes what is accepted: not descriptions, formats or regular expressions. */
function essence(schema: any): any {
  if (schema === null || typeof schema !== "object") return schema;
  const out: any = {};
  if (Array.isArray(schema.anyOf)) {
    if (schema.anyOf.every((s: any) => "const" in s)) return { enum: schema.anyOf.map((s: any) => s.const).sort() };
    out.anyOf = schema.anyOf.map(essence).sort((a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (schema.type) out.type = Array.isArray(schema.type) ? [...schema.type].sort() : schema.type;
  if (schema.enum) out.enum = [...schema.enum].sort();
  if ("const" in schema) out.const = schema.const;
  for (const key of ["minLength", "maxLength", "minimum", "maximum", "minItems", "maxItems", "additionalProperties"]) {
    if (key in schema) out[key] = schema[key];
  }
  if (schema.required) out.required = [...schema.required].sort();
  if (schema.properties) {
    out.properties = Object.fromEntries(Object.entries(schema.properties).map(([k, v]) => [k, essence(v)]));
  }
  if (schema.items) out.items = essence(schema.items);
  return out;
}

function toolSchema(shape: Record<string, z.ZodType>, without: string[] = []): any {
  const rest = Object.fromEntries(Object.entries(shape).filter(([key]) => !without.includes(key)));
  return essence(z.toJSONSchema(z.strictObject(rest), { io: "input" }));
}

describe("the tools' inputs match Vereel's API definition", () => {
  it("create_offer = CreateOffer", () => {
    expect(toolSchema(createOfferShape)).toEqual(essence(schemas.CreateOffer));
  });

  it("update_offer = UpdateOffer (plus the offer id, which is in the path)", () => {
    expect(toolSchema(updateOfferShape, ["offerId"])).toEqual(essence(schemas.UpdateOffer));
  });

  it("search_offers = the query of GET /offers", () => {
    const params = spec.paths["/offers"].get.parameters as any[];
    const fromSpec = Object.fromEntries(params.map((p) => [p.name, essence(p.schema)]));
    const mine = toolSchema(searchOffersShape).properties;
    expect(mine).toEqual(fromSpec);
  });

  it("list_my_offers = the query of GET /my/offers", () => {
    const params = spec.paths["/my/offers"].get.parameters as any[];
    const fromSpec = Object.fromEntries(params.map((p) => [p.name, essence(p.schema)]));
    expect(toolSchema(listMyOffersShape).properties).toEqual(fromSpec);
  });

  it("add_offer_image can send what AttachImage accepts, and upload what UploadUrlRequest allows", () => {
    const options = schemas.AttachImage.anyOf.map((o: any) => Object.keys(o.properties)[0]).sort();
    expect(options).toEqual(["uploadPath", "url"]);
    expect(Object.keys(addImageShape)).toEqual(expect.arrayContaining(["offerId", "imageUrl", "filePath"]));
    expect(schemas.AttachImage.anyOf.find((o: any) => o.properties.url).properties.url.maxLength).toBe(2048);
    expect([...schemas.UploadUrlRequest.properties.contentType.enum].sort()).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(Object.keys(schemas.UploadUrl.properties).sort()).toEqual(expect.arrayContaining(["headers", "uploadPath", "uploadUrl"]));
  });
});

describe("the tools call routes that exist", () => {
  const routes: Array<[string, string]> = [
    ["get", "/categories"],
    ["get", "/offers"],
    ["get", "/offers/{id}"],
    ["get", "/my/offers"],
    ["get", "/my/offers/{id}"],
    ["post", "/my/offers"],
    ["patch", "/my/offers/{id}"],
    ["post", "/my/offers/{id}/images"],
    ["post", "/my/offers/{id}/images/upload-url"],
  ];

  it.each(routes)("%s %s", (method, route) => {
    expect(spec.paths[route]?.[method], `${method.toUpperCase()} ${route}`).toBeDefined();
  });

  it("the server base URL is the one this package defaults to", async () => {
    const { DEFAULT_API_URL } = await import("../src/config.js");
    expect(spec.servers[0].url).toBe(DEFAULT_API_URL);
  });
});

describe("every error the API can return is explained to the model", () => {
  it("has a hint for each code (RATE_LIMITED is explained in code, from Retry-After)", () => {
    const codes: string[] = schemas.Error.properties.error.properties.code.enum;
    const missing = codes.filter((code) => !HINTS[code] && code !== "RATE_LIMITED");
    expect(missing, `error codes without a hint: ${missing.join(", ")} (add one in src/results.ts)`).toEqual([]);
  });
});
