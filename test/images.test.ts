import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalInputError } from "../src/errors.js";
import { MAX_IMAGE_BYTES, expandHome, readLocalImage, sniffImage } from "../src/images.js";

const JPEG = [0xff, 0xd8, 0xff, 0xe0];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const WEBP = [...Buffer.from("RIFF"), 1, 2, 3, 4, ...Buffer.from("WEBP")];

function tmp() {
  return mkdtempSync(path.join(tmpdir(), "vereel-mcp-img-"));
}

describe("sniffImage", () => {
  it("knows JPEG, PNG and WebP by their first bytes", () => {
    expect(sniffImage(Uint8Array.from(JPEG))).toBe("image/jpeg");
    expect(sniffImage(Uint8Array.from(PNG))).toBe("image/png");
    expect(sniffImage(Uint8Array.from(WEBP))).toBe("image/webp");
  });

  it("knows nothing else", () => {
    expect(sniffImage(Uint8Array.from(Buffer.from("GIF89a")))).toBeNull();
    expect(sniffImage(Uint8Array.from(Buffer.from("<svg xmlns=")))).toBeNull();
    expect(sniffImage(Uint8Array.from(Buffer.from("%PDF-1.7")))).toBeNull();
    expect(sniffImage(Uint8Array.from(Buffer.from("RIFF....WAVE")))).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe("expandHome", () => {
  it("expands a leading ~ and nothing else", () => {
    expect(expandHome("~/Desktop/a.jpg", "/home/me")).toBe(path.join("/home/me", "/Desktop/a.jpg"));
    expect(expandHome("~\\Desktop\\a.jpg", "C:\\Users\\me")).toBe(path.join("C:\\Users\\me", "\\Desktop\\a.jpg"));
    expect(expandHome("/srv/~/a.jpg", "/home/me")).toBe("/srv/~/a.jpg");
    expect(expandHome("~other/a.jpg", "/home/me")).toBe("~other/a.jpg");
  });
});

describe("readLocalImage", () => {
  it("reads an image and names its type from its content, not its extension", async () => {
    const dir = tmp();
    const file = path.join(dir, "photo.txt");
    writeFileSync(file, Buffer.from([...JPEG, 0, 0, 0]));
    const image = await readLocalImage(file, []);
    expect(image.contentType).toBe("image/jpeg");
    expect(image.bytes.length).toBe(7);
  });

  it("refuses a file that merely has an image name", async () => {
    const file = path.join(tmp(), "id_rsa.png");
    writeFileSync(file, "-----BEGIN OPENSSH PRIVATE KEY-----");
    await expect(readLocalImage(file, [])).rejects.toThrow(/not a JPEG, PNG or WebP/);
  });

  it("refuses a missing file, a folder, an empty file and a file over 5 MB", async () => {
    const dir = tmp();
    await expect(readLocalImage(path.join(dir, "nope.png"), [])).rejects.toThrow(/no file/);
    await expect(readLocalImage(dir, [])).rejects.toThrow(LocalInputError);
    const empty = path.join(dir, "empty.png");
    writeFileSync(empty, "");
    await expect(readLocalImage(empty, [])).rejects.toThrow(/empty/);
    const big = path.join(dir, "big.png");
    writeFileSync(big, Buffer.concat([Buffer.from(PNG), Buffer.alloc(MAX_IMAGE_BYTES)]));
    await expect(readLocalImage(big, [])).rejects.toThrow(/5 MB/);
  });

  it("reads only inside the allowed folders when some are set", async () => {
    const root = tmp();
    const allowed = path.join(root, "allowed");
    const other = path.join(root, "other");
    mkdirSync(allowed);
    mkdirSync(other);
    writeFileSync(path.join(allowed, "a.png"), Buffer.from([...PNG, 1]));
    writeFileSync(path.join(other, "b.png"), Buffer.from([...PNG, 1]));

    await expect(readLocalImage(path.join(allowed, "a.png"), [allowed])).resolves.toMatchObject({ contentType: "image/png" });
    await expect(readLocalImage(path.join(other, "b.png"), [allowed])).rejects.toThrow(/outside the folders/);
    // A path that climbs out of the allowed folder resolves before it is judged.
    await expect(readLocalImage(path.join(allowed, "..", "other", "b.png"), [allowed])).rejects.toThrow(/outside the folders/);
    // A folder whose name merely starts like the allowed one is not inside it.
    const sibling = path.join(root, "allowed-too");
    mkdirSync(sibling);
    writeFileSync(path.join(sibling, "c.png"), Buffer.from([...PNG, 1]));
    await expect(readLocalImage(path.join(sibling, "c.png"), [allowed])).rejects.toThrow(/outside the folders/);
  });
});
