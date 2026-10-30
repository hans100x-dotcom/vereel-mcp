import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { LocalInputError } from "./errors.js";

// Reading an image from this machine to send it to Vereel. The model chooses
// the path, and a model reading hostile text could be told to pick any path,
// so the file is judged by its content here, before anything leaves the
// machine: only a JPEG, PNG or WebP of at most 5 MB is ever sent. Optionally
// (VEREEL_IMAGE_DIRS) the folders it may come from are limited as well.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type ImageType = "image/jpeg" | "image/png" | "image/webp";

export function sniffImage(head: Uint8Array): ImageType | null {
  const at = (i: number) => head[i];
  if (head.length >= 3 && at(0) === 0xff && at(1) === 0xd8 && at(2) === 0xff) return "image/jpeg";
  if (head.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, i) => at(i) === byte)) return "image/png";
  if (head.length >= 12 && String.fromCharCode(...head.subarray(0, 4)) === "RIFF" && String.fromCharCode(...head.subarray(8, 12)) === "WEBP") return "image/webp";
  return null;
}

/** `~/photo.jpg` is how people (and models) write a path in their home folder; Node does not expand it. */
export function expandHome(filePath: string, home: string = os.homedir()): string {
  return /^~(?=$|[\\/])/.test(filePath) ? path.join(home, filePath.slice(1)) : filePath;
}

function isInside(dir: string, file: string): boolean {
  const relative = path.relative(dir, file);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function readLocalImage(filePath: string, imageDirs: string[]): Promise<{ bytes: Buffer; contentType: ImageType }> {
  let real: string;
  try {
    real = await fs.realpath(path.resolve(expandHome(filePath)));
  } catch {
    throw new LocalInputError("There is no file at that path");
  }

  if (imageDirs.length > 0) {
    const roots = await Promise.all(imageDirs.map((dir) => fs.realpath(dir).catch(() => dir)));
    if (!roots.some((root) => isInside(root, real))) {
      throw new LocalInputError("That file is outside the folders this server may read images from (VEREEL_IMAGE_DIRS)");
    }
  }

  const stat = await fs.stat(real);
  if (!stat.isFile()) throw new LocalInputError("That path is not a file");
  if (stat.size === 0) throw new LocalInputError("The file is empty");
  if (stat.size > MAX_IMAGE_BYTES) throw new LocalInputError("An image can be at most 5 MB");

  const bytes = await fs.readFile(real);
  if (bytes.length > MAX_IMAGE_BYTES) throw new LocalInputError("An image can be at most 5 MB");
  const contentType = sniffImage(bytes.subarray(0, 16));
  if (!contentType) throw new LocalInputError("The file is not a JPEG, PNG or WebP image. Nothing was sent.");
  return { bytes, contentType };
}
