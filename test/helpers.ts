import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { loadConfig, type Config } from "../src/config.js";
import { createServer } from "../src/server.js";

export const TOKEN = "vrl_" + "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v";

export interface Recorded {
  url: URL;
  method: string;
  headers: Record<string, string>;
  body: string | Uint8Array | undefined;
  init: RequestInit;
}

export type Reply = Response | Error | ((req: Recorded) => Response);

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

export function apiError(status: number, code: string, message: string, details: Record<string, unknown> = {}, headers: Record<string, string> = {}): Response {
  return json(status, { error: { code, message, details } }, headers);
}

/** A fetch that answers from a script, in order, and remembers what it was asked. */
export function scriptedFetch(replies: Reply[]) {
  const calls: Recorded[] = [];
  const fetchImpl = (async (input: URL | string, init: RequestInit = {}) => {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries((init.headers ?? {}) as Record<string, string>)) headers[k.toLowerCase()] = v;
    const call: Recorded = {
      url: new URL(String(input)),
      method: init.method ?? "GET",
      headers,
      body: init.body as string | Uint8Array | undefined,
      init,
    };
    calls.push(call);
    const reply = replies.shift();
    if (!reply) throw new Error(`unexpected request: ${call.method} ${call.url}`);
    if (reply instanceof Error) throw reply;
    return typeof reply === "function" ? reply(call) : reply;
  }) as typeof fetch;
  return { fetchImpl, calls };
}

export function configFor(env: Record<string, string | undefined> = {}): Config {
  return loadConfig({ VEREEL_API_TOKEN: TOKEN, ...env } as NodeJS.ProcessEnv);
}

export async function connect(replies: Reply[], env: Record<string, string | undefined> = {}) {
  const { fetchImpl, calls } = scriptedFetch(replies);
  const config = configFor(env);
  const { server, tools } = createServer(config, fetchImpl);
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  return {
    client,
    calls,
    tools,
    async call(name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
      return (await client.callTool({ name, arguments: args })) as CallToolResult;
    },
    async close() {
      await client.close();
      await server.close();
    },
  };
}

export function textOf(result: CallToolResult): string {
  return result.content.map((c) => (c.type === "text" ? c.text : "")).join("\n");
}

/** The JSON block of a result (the last block that parses). */
export function dataOf(result: CallToolResult): unknown {
  for (const block of [...result.content].reverse()) {
    if (block.type !== "text") continue;
    try {
      return JSON.parse(block.text);
    } catch {
      /* a prose block */
    }
  }
  throw new Error("no JSON in result: " + textOf(result));
}
