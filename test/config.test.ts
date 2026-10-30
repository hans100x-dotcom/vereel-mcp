import path from "node:path";
import { describe, expect, it } from "vitest";
import { ConfigError, DEFAULT_API_URL, loadConfig } from "../src/config.js";
import { TOKEN } from "./helpers.js";

const load = (env: Record<string, string>) => loadConfig(env as NodeJS.ProcessEnv);

describe("loadConfig", () => {
  it("defaults to Vereel's API, with no token and writes allowed", () => {
    expect(load({})).toMatchObject({ baseUrl: DEFAULT_API_URL, token: null, readOnly: false, imageDirs: [] });
  });

  it("takes the token and trims it", () => {
    expect(load({ VEREEL_API_TOKEN: `  ${TOKEN}\n` }).token).toBe(TOKEN);
  });

  it("refuses a token of the wrong shape without printing it", () => {
    const wrong = "sk-live-0123456789abcdef";
    expect(() => load({ VEREEL_API_TOKEN: wrong })).toThrow(ConfigError);
    try {
      load({ VEREEL_API_TOKEN: wrong });
    } catch (err) {
      expect((err as Error).message).not.toContain(wrong);
    }
  });

  it("refuses a token that could break out of a header", () => {
    expect(() => load({ VEREEL_API_TOKEN: `${TOKEN}\r\nX-Evil: 1` })).toThrow(ConfigError);
  });

  it("needs https, except for this machine", () => {
    expect(() => load({ VEREEL_API_URL: "http://www.vereel.com/api/v1/public" })).toThrow(/https/);
    expect(() => load({ VEREEL_API_URL: "ftp://example.com" })).toThrow(/https/);
    expect(load({ VEREEL_API_URL: "http://localhost:3000/api/v1/public" }).baseUrl).toBe("http://localhost:3000/api/v1/public");
    expect(load({ VEREEL_API_URL: "http://127.0.0.1:3000/api/v1/public/" }).baseUrl).toBe("http://127.0.0.1:3000/api/v1/public");
  });

  it("refuses an address with credentials, a query or a fragment", () => {
    for (const url of ["https://user:pw@example.com/api", "https://example.com/api?x=1", "https://example.com/api#frag"]) {
      expect(() => load({ VEREEL_API_URL: url }), url).toThrow(ConfigError);
    }
  });

  it("refuses something that is not a URL", () => {
    expect(() => load({ VEREEL_API_URL: "not a url" })).toThrow(ConfigError);
  });

  it("reads the read-only switch", () => {
    for (const on of ["1", "true", "TRUE", "yes", "on"]) expect(load({ VEREEL_READ_ONLY: on }).readOnly, on).toBe(true);
    for (const off of ["", "0", "false", "no"]) expect(load({ VEREEL_READ_ONLY: off }).readOnly, off).toBe(false);
  });

  it("splits the image folders on the platform's separator", () => {
    const joined = ["/srv/a", "/srv/b"].join(path.delimiter);
    expect(load({ VEREEL_IMAGE_DIRS: joined }).imageDirs).toEqual([path.resolve("/srv/a"), path.resolve("/srv/b")]);
  });
});
