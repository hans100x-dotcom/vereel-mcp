#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConfigError, DEFAULT_API_URL, loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { VERSION } from "./version.js";

const USAGE = `vereel-mcp ${VERSION}
MCP server for Vereel (https://www.vereel.com): brands and companies add influencer-marketing
offers, and anyone can search the public ones. Speaks MCP over stdin/stdout.

Environment:
  VEREEL_API_TOKEN   A brand token (vrl_…) from Vereel › Settings › API tokens.
                     Without it the server can only search public offers.
  VEREEL_READ_ONLY   1 = do not offer the tools that create or change offers.
  VEREEL_IMAGE_DIRS  Folders local images may be uploaded from (separated by ${process.platform === "win32" ? ";" : ":"}). Default: any.
  VEREEL_API_URL     Default ${DEFAULT_API_URL}

Docs: https://github.com/hans100x-dotcom/vereel-mcp
`;

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (arg === "--version" || arg === "-v") {
    console.log(VERSION);
    return;
  }
  if (arg === "--help" || arg === "-h") {
    console.log(USAGE);
    return;
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(`vereel-mcp: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }

  const { server, tools } = createServer(config);
  await server.connect(new StdioServerTransport());

  // stdout carries the protocol; anything for a human goes to stderr.
  const mode = config.token ? (config.readOnly ? "token, read-only" : "token") : "no token, search only";
  console.error(`vereel-mcp ${VERSION} ready (${mode}; ${tools.length} tools; ${config.baseUrl})`);
}

main().catch((err: unknown) => {
  console.error(`vereel-mcp: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
