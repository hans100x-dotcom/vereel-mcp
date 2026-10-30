// Refreshes spec/openapi.json from Vereel's public definition. The tools'
// inputs mirror that definition and test/spec-drift.test.ts compares the two,
// so run this when Vereel changes its API, then fix whatever the test reports.
//
//   npm run sync-spec
//   VEREEL_API_URL=http://localhost:3000/api/v1/public npm run sync-spec
import { writeFileSync } from "node:fs";

const base = (process.env.VEREEL_API_URL ?? "https://www.vereel.com/api/v1/public").replace(/\/+$/, "");
const res = await fetch(`${base}/openapi.json`, { redirect: "error" });
if (!res.ok) {
  console.error(`sync-spec: ${base}/openapi.json answered HTTP ${res.status}`);
  process.exit(1);
}
const spec = await res.json();
if (typeof spec?.openapi !== "string" || !spec.paths) {
  console.error("sync-spec: the answer is not an OpenAPI definition");
  process.exit(1);
}
writeFileSync(new URL("../spec/openapi.json", import.meta.url), JSON.stringify(spec, null, 2) + "\n");
console.log(`sync-spec: wrote spec/openapi.json (API version ${spec.info?.version}, ${Object.keys(spec.paths).length} paths)`);
