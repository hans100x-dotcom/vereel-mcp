import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "../src/version.js";

describe("package", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  it("reports the version package.json declares", () => {
    expect(VERSION).toBe(pkg.version);
  });

  it("installs a `vereel-mcp` command", () => {
    expect(pkg.bin["vereel-mcp"]).toBe("dist/index.js");
    expect(readFileSync(new URL("../src/index.ts", import.meta.url), "utf8").startsWith("#!/usr/bin/env node")).toBe(true);
  });
});
