// `tsc` keeps the shebang of src/index.ts but does not mark the output as
// executable. npm does that for a bin on install; this covers running
// dist/index.js directly from a clone.
import { chmodSync } from "node:fs";

try {
  chmodSync(new URL("../dist/index.js", import.meta.url), 0o755);
} catch {
  // Windows file systems have no such bit.
}
