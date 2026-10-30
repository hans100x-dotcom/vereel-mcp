import { isAllowedUrl, type Config } from "./config.js";
import { MissingTokenError, VereelApiError, VereelNetworkError } from "./errors.js";
import { VERSION } from "./version.js";

// The one place that talks to Vereel. Rules it keeps for every request:
//   - the token goes only to the configured Vereel API, only as a Bearer header,
//     and only on routes that need it (browsing is anonymous);
//   - no redirect is followed, so the token cannot be forwarded elsewhere;
//   - every request has a timeout and a cap on how much of the answer is read;
//   - nothing here retries: creating an offer is not idempotent, so a retry
//     after a lost answer could create it twice.

const MAX_RESPONSE_BYTES = 1024 * 1024;

type Query = Record<string, string | number | undefined>;

export interface RequestOptions {
  method: "GET" | "POST" | "PATCH";
  /** Path below the base URL, starting with a slash. */
  path: string;
  query?: Query;
  body?: unknown;
  /** "token": send the brand token, and refuse to run without one. "none": anonymous. */
  auth: "token" | "none";
}

export type FetchLike = typeof fetch;

/** Headers a signed upload URL may ask for; anything else it returns is ignored. */
const UPLOAD_HEADERS = new Set(["content-type", "x-upsert", "cache-control"]);

export class VereelClient {
  constructor(
    private readonly config: Config,
    private readonly fetchImpl: FetchLike = fetch
  ) {}

  get hasToken(): boolean {
    return this.config.token !== null;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    if (options.auth === "token" && !this.config.token) throw new MissingTokenError();

    const url = new URL(this.config.baseUrl + options.path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": `vereel-mcp/${VERSION}`,
    };
    if (options.auth === "token") headers.Authorization = `Bearer ${this.config.token}`;
    if (options.body !== undefined) headers["Content-Type"] = "application/json";

    const res = await this.send(url, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return this.parse<T>(res);
  }

  /**
   * Sends the bytes of an image to the signed URL Vereel handed out. No token
   * goes along: the URL itself is the permission.
   */
  async putBytes(uploadUrl: string, headers: Record<string, string>, bytes: Uint8Array): Promise<void> {
    let url: URL;
    try {
      url = new URL(uploadUrl);
    } catch {
      throw new VereelApiError("UPLOAD_FAILED", "Vereel returned an upload address that is not a URL", 502);
    }
    if (!isAllowedUrl(url)) throw new VereelApiError("UPLOAD_FAILED", "Vereel returned an upload address that is not https", 502);

    const allowed: Record<string, string> = {};
    for (const [name, value] of Object.entries(headers)) {
      if (UPLOAD_HEADERS.has(name.toLowerCase())) allowed[name] = value;
    }

    const res = await this.send(url, { method: "PUT", headers: allowed, body: bytes as RequestInit["body"] });
    if (!res.ok) {
      // The body of a storage error can echo the signed URL; report the status only.
      throw new VereelApiError("UPLOAD_FAILED", `The image upload was refused (HTTP ${res.status})`, res.status);
    }
    await res.body?.cancel().catch(() => undefined);
  }

  private async send(url: URL, init: RequestInit): Promise<Response> {
    try {
      return await this.fetchImpl(url, {
        ...init,
        redirect: "error",
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
      throw new VereelNetworkError(timedOut ? "Vereel did not answer in time" : "Could not reach Vereel", timedOut);
    }
  }

  private async parse<T>(res: Response): Promise<T> {
    const text = await readCapped(res, MAX_RESPONSE_BYTES);
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }

    if (!res.ok) throw apiError(res, json);
    if (json === undefined || json === null || typeof json !== "object") {
      throw new VereelApiError("UNEXPECTED_RESPONSE", "Vereel answered with something that is not JSON", res.status);
    }
    return json as T;
  }
}

function apiError(res: Response, json: unknown): VereelApiError {
  const retryAfter = Number(res.headers.get("retry-after"));
  const retry = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null;
  const error = (json as { error?: { code?: unknown; message?: unknown; details?: unknown } } | undefined)?.error;
  if (error && typeof error.code === "string") {
    const details = error.details && typeof error.details === "object" ? (error.details as Record<string, unknown>) : {};
    return new VereelApiError(error.code, typeof error.message === "string" ? error.message : error.code, res.status, details, retry);
  }
  // Not Vereel's own error shape (a gateway page, for instance): say only what is known.
  return new VereelApiError("UNEXPECTED_RESPONSE", `Vereel answered with HTTP ${res.status}`, res.status, {}, retry);
}

async function readCapped(res: Response, limit: number): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    await res.body?.cancel().catch(() => undefined);
    throw new VereelApiError("UNEXPECTED_RESPONSE", "Vereel's answer is larger than this server reads", res.status);
  }
  if (!res.body) return "";

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => undefined);
      throw new VereelApiError("UNEXPECTED_RESPONSE", "Vereel's answer is larger than this server reads", res.status);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
