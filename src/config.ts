import path from "node:path";

export const DEFAULT_API_URL = "https://www.vereel.com/api/v1/public";
const DEFAULT_TIMEOUT_MS = 30_000;

export interface Config {
  /** The API's base URL, without a trailing slash. */
  baseUrl: string;
  /** A brand token (`vrl_…`), or null when the server only browses. */
  token: string | null;
  /** Do not offer the tools that change anything. */
  readOnly: boolean;
  /** When not empty, local images may only be read from inside these folders. */
  imageDirs: string[];
  timeoutMs: number;
}

export class ConfigError extends Error {}

// 4 + 43 characters today; the range leaves room for a longer token later
// while still refusing anything that could break out of a header.
const TOKEN_PATTERN = /^vrl_[A-Za-z0-9_-]{20,128}$/;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** https everywhere; plain http only to this machine, for trying the server against a local Vereel. */
export function isAllowedUrl(url: URL): boolean {
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
}

function flag(value: string | undefined): boolean {
  return ["1", "true", "yes", "on"].includes((value ?? "").trim().toLowerCase());
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const rawUrl = (env.VEREEL_API_URL ?? "").trim() || DEFAULT_API_URL;
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ConfigError(`VEREEL_API_URL is not a URL: ${rawUrl}`);
  }
  if (!isAllowedUrl(url)) {
    throw new ConfigError("VEREEL_API_URL must start with https:// (http:// is accepted only for localhost)");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new ConfigError("VEREEL_API_URL must be a plain address: no credentials, query or fragment");
  }

  const rawToken = (env.VEREEL_API_TOKEN ?? "").trim();
  if (rawToken && !TOKEN_PATTERN.test(rawToken)) {
    // Never echo the value: it may well be a real secret pasted in the wrong shape.
    throw new ConfigError("VEREEL_API_TOKEN does not look like a Vereel token (it starts with vrl_). Create one in Vereel under Settings › API tokens.");
  }

  const imageDirs = (env.VEREEL_IMAGE_DIRS ?? "")
    .split(path.delimiter)
    .map((dir) => dir.trim())
    .filter(Boolean)
    .map((dir) => path.resolve(dir));

  return {
    baseUrl: url.toString().replace(/\/+$/, ""),
    token: rawToken || null,
    readOnly: flag(env.VEREEL_READ_ONLY),
    imageDirs,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}
