import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { VereelClient } from "./client.js";
import type { Config } from "./config.js";
import { LocalInputError, MissingTokenError } from "./errors.js";
import { readLocalImage } from "./images.js";
import { failure, ok } from "./results.js";
import { addImageSchema, addImageShape, createOfferShape, getMyOfferShape, getOfferShape, listMyOffersShape, searchOffersShape, updateOfferShape } from "./schemas.js";

// The tools. Each one is a thin step over one Vereel public API route (or, for
// images from this machine, three). The rules themselves — what an offer may
// hold, who may change it, what waits for review — live on Vereel's side and
// are not repeated here.

interface Page<T> {
  data: T[];
  meta?: { cursor?: string | null; hasMore?: boolean };
}

interface Single<T> {
  data: T;
}

interface OwnOffer {
  id?: string;
  status?: string;
  missing?: string[];
}

const READ: ToolAnnotations = { readOnlyHint: true, openWorldHint: true };

const LOST_ANSWER = {
  create: "The request may or may not have reached Vereel. Call vereel_list_my_offers before trying again, so the offer is not created twice.",
  change: "The request may or may not have reached Vereel. Call vereel_get_my_offer to see what was saved before trying again.",
  image: "The request may or may not have reached Vereel. Call vereel_get_my_offer to see which photos the offer has before trying again.",
};

export const TOOL_NAMES = {
  listCategories: "vereel_list_categories",
  searchOffers: "vereel_search_offers",
  getOffer: "vereel_get_offer",
  listMyOffers: "vereel_list_my_offers",
  getMyOffer: "vereel_get_my_offer",
  createOffer: "vereel_create_offer",
  updateOffer: "vereel_update_offer",
  addOfferImage: "vereel_add_offer_image",
} as const;

export const WRITE_TOOLS: readonly string[] = [TOOL_NAMES.createOffer, TOOL_NAMES.updateOffer, TOOL_NAMES.addOfferImage];

const encode = encodeURIComponent;

function nextStepAfterSave(offer: OwnOffer): string {
  if (offer.missing?.includes("photo")) {
    return "This offer has no photo yet, and Vereel cannot approve it without one. Add one with vereel_add_offer_image, using this offer's id.";
  }
  if (offer.status === "in_review") {
    return "The offer is waiting for Vereel's review and is not public yet. vereel_get_my_offer shows its status; Vereel tells the brand when it decides.";
  }
  return "";
}

export function registerTools(server: McpServer, client: VereelClient, config: Config): string[] {
  const registered: string[] = [];

  function define<S extends z.ZodType>(
    name: string,
    spec: {
      title: string;
      description: string;
      schema: S;
      annotations: ToolAnnotations;
      /** The tool sends the brand's token, so it is useless without one. */
      needsToken?: boolean;
      /** Set for tools that change something. */
      onLostAnswer?: string;
    },
    run: (args: z.infer<S>) => Promise<CallToolResult>
  ): void {
    const isWrite = WRITE_TOOLS.includes(name);
    if (isWrite && config.readOnly) return;

    server.registerTool(
      name,
      { title: spec.title, description: spec.description, inputSchema: spec.schema, annotations: { title: spec.title, ...spec.annotations } },
      (async (args: z.infer<S>): Promise<CallToolResult> => {
        try {
          if (spec.needsToken && !client.hasToken) throw new MissingTokenError();
          return await run(args);
        } catch (err) {
          return failure(err, { token: config.token, onLostAnswer: spec.onLostAnswer });
        }
      }) as never
    );
    registered.push(name);
  }

  // ── anonymous: what any visitor of vereel.com can see ──────────────────────

  define(
    TOOL_NAMES.listCategories,
    {
      title: "List Vereel categories",
      description:
        "List the categories Vereel files offers under (for example beauty, fashion, travel). Their ids are what vereel_create_offer takes as categoryIds and vereel_search_offers takes as category. No token needed.",
      schema: z.strictObject({}),
      annotations: READ,
    },
    async () => {
      const res = await client.request<Page<{ id: string; name: string | null }>>({ method: "GET", path: "/categories", auth: "none" });
      return ok(res.data);
    }
  );

  define(
    TOOL_NAMES.searchOffers,
    {
      title: "Search public offers",
      description:
        "Search the influencer-marketing offers (campaigns) that brands have published on Vereel and that creators can apply to, newest first. Filter by words, category, type, platform and language. Shows what an anonymous visitor of the site sees: no payment amounts. Use nextCursor to get the next page. No token needed.",
      schema: z.strictObject(searchOffersShape),
      annotations: READ,
    },
    async (args) => {
      const res = await client.request<Page<unknown>>({ method: "GET", path: "/offers", query: args, auth: "none" });
      return ok({ offers: res.data, nextCursor: res.meta?.cursor ?? null, hasMore: res.meta?.hasMore ?? false }, { untrusted: true });
    }
  );

  define(
    TOOL_NAMES.getOffer,
    {
      title: "Get a public offer",
      description:
        "Get one public Vereel offer with the details its page on vereel.com shows: what the creator does, deliverables, platforms, audience, follower minimum, apply-by date and the link to the offer's page. No payment amounts. No token needed.",
      schema: z.strictObject(getOfferShape),
      annotations: READ,
    },
    async ({ offerId }) => {
      const res = await client.request<Single<unknown>>({ method: "GET", path: `/offers/${encode(offerId)}`, auth: "none" });
      return ok(res.data, { untrusted: true });
    }
  );

  // ── the brand's own offers: a token is needed ──────────────────────────────

  define(
    TOOL_NAMES.listMyOffers,
    {
      title: "List my offers",
      description:
        "List the offers the brand that owns the token has created through the API, newest first, with each one's status: in_review (waiting for Vereel), active (public), rejected (with Vereel's note) or closed. Use it to check progress or to find an offer's id. Needs a brand token (read or read-and-write).",
      schema: z.strictObject(listMyOffersShape),
      annotations: READ,
      needsToken: true,
    },
    async (args) => {
      const res = await client.request<Page<unknown>>({ method: "GET", path: "/my/offers", query: args, auth: "token" });
      return ok({ offers: res.data, nextCursor: res.meta?.cursor ?? null, hasMore: res.meta?.hasMore ?? false }, { untrusted: true });
    }
  );

  define(
    TOOL_NAMES.getMyOffer,
    {
      title: "Get one of my offers",
      description:
        "Get one offer the brand created through the API, in full: every field, its status, the photos, what is still missing before Vereel can approve it, and the reviewer's note if it was rejected. Needs a brand token (read or read-and-write).",
      schema: z.strictObject(getMyOfferShape),
      annotations: READ,
      needsToken: true,
    },
    async ({ offerId }) => {
      const res = await client.request<Single<unknown>>({ method: "GET", path: `/my/offers/${encode(offerId)}`, auth: "token" });
      return ok(res.data, { untrusted: true });
    }
  );

  define(
    TOOL_NAMES.createOffer,
    {
      title: "Create an offer",
      description:
        "Add an offer (an influencer-marketing campaign) to Vereel for the brand that owns the token, so creators on Instagram, TikTok, YouTube or X can find it and apply. " +
        "The offer is NOT public yet: Vereel reviews every offer sent through the API and publishes it once approved. It needs at least one photo before it can be approved: pass imageUrls, or add one afterwards with vereel_add_offer_image. " +
        "Get categoryIds from vereel_list_categories. Show the user the campaign details and get their go-ahead before calling, because this sends the offer to Vereel's reviewers. " +
        "Needs a read-and-write brand token.",
      schema: z.strictObject(createOfferShape),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      needsToken: true,
      onLostAnswer: LOST_ANSWER.create,
    },
    async (args) => {
      const res = await client.request<Single<OwnOffer>>({ method: "POST", path: "/my/offers", body: args, auth: "token" });
      return ok(res.data, { untrusted: true, next: nextStepAfterSave(res.data) || undefined });
    }
  );

  define(
    TOOL_NAMES.updateOffer,
    {
      title: "Change an offer in review",
      description:
        "Change an offer the brand created through the API, while it is still in review. Only the fields you give change. To reorder or remove photos, pass photos with the offer's current photo URLs in the new order (leaving one out removes it); to add a photo use vereel_add_offer_image. " +
        "An offer that is already public or rejected cannot be changed through the API. Needs a read-and-write brand token.",
      schema: z.strictObject(updateOfferShape),
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
      needsToken: true,
      onLostAnswer: LOST_ANSWER.change,
    },
    async ({ offerId, ...changes }) => {
      if (Object.keys(changes).length === 0) throw new LocalInputError("Give at least one field to change besides offerId.");
      const res = await client.request<Single<OwnOffer>>({ method: "PATCH", path: `/my/offers/${encode(offerId)}`, body: changes, auth: "token" });
      return ok(res.data, { untrusted: true, next: nextStepAfterSave(res.data) || undefined });
    }
  );

  define(
    TOOL_NAMES.addOfferImage,
    {
      title: "Add a photo to an offer",
      description:
        "Add one photo to an offer that is still in review. Give either imageUrl (an https link Vereel downloads) or filePath (an image on the machine this server runs on, which is uploaded for you). JPEG, PNG or WebP, at most 5 MB, at most 6 photos per offer; the first photo is the cover. " +
        "Needs a read-and-write brand token.",
      schema: addImageSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
      needsToken: true,
      onLostAnswer: LOST_ANSWER.image,
    },
    async ({ offerId, imageUrl, filePath }) => {
      const base = `/my/offers/${encode(offerId)}/images`;
      let body: { url: string } | { uploadPath: string };

      if (filePath !== undefined) {
        // Judge the file before anything is asked of Vereel.
        const image = await readLocalImage(filePath, config.imageDirs);
        const slot = await client.request<Single<{ uploadUrl: string; uploadPath: string; headers?: Record<string, string> }>>({
          method: "POST",
          path: `${base}/upload-url`,
          body: { contentType: image.contentType },
          auth: "token",
        });
        await client.putBytes(slot.data.uploadUrl, slot.data.headers ?? { "Content-Type": image.contentType }, image.bytes);
        body = { uploadPath: slot.data.uploadPath };
      } else {
        body = { url: imageUrl as string };
      }

      const res = await client.request<Single<OwnOffer>>({ method: "POST", path: base, body, auth: "token" });
      return ok(res.data, { untrusted: true, next: nextStepAfterSave(res.data) || undefined });
    }
  );

  return registered;
}
