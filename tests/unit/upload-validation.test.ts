import { describe, it, expect } from "vitest";
import { validateUploadRequest, verifyMagicBytes } from "@/server/services/storage/upload-validation";

describe("validateUploadRequest", () => {
  it("accepts a correctly-typed PDF within size limits", () => {
    const result = validateUploadRequest({ fileName: "plans.pdf", mimeType: "application/pdf", sizeBytes: 1_000_000 });
    expect(result.valid).toBe(true);
  });

  it("rejects an unsupported MIME type", () => {
    const result = validateUploadRequest({ fileName: "virus.exe", mimeType: "application/x-msdownload", sizeBytes: 1000 });
    expect(result.valid).toBe(false);
  });

  it("rejects a file whose extension doesn't match its declared MIME type", () => {
    const result = validateUploadRequest({ fileName: "plans.exe", mimeType: "application/pdf", sizeBytes: 1000 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/extension/i);
  });

  it("rejects a zero-byte file", () => {
    const result = validateUploadRequest({ fileName: "empty.pdf", mimeType: "application/pdf", sizeBytes: 0 });
    expect(result.valid).toBe(false);
  });

  it("rejects a file exceeding its type's size limit", () => {
    const result = validateUploadRequest({ fileName: "huge.pdf", mimeType: "application/pdf", sizeBytes: 500 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/exceeds/i);
  });

  it("rejects a file with no extension at all", () => {
    const result = validateUploadRequest({ fileName: "noextension", mimeType: "application/pdf", sizeBytes: 1000 });
    expect(result.valid).toBe(false);
  });

  it("accepts AEC-specific formats like DWG under the generic octet-stream fallback", () => {
    const result = validateUploadRequest({ fileName: "floorplan.dwg", mimeType: "application/octet-stream", sizeBytes: 5_000_000 });
    expect(result.valid).toBe(true);
  });
});

describe("verifyMagicBytes", () => {
  it("confirms a PDF's magic bytes match the %PDF signature", () => {
    const buffer = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
    expect(verifyMagicBytes("application/pdf", buffer)).toBe(true);
  });

  it("rejects a file claiming to be a PDF without the correct signature", () => {
    const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(verifyMagicBytes("application/pdf", buffer)).toBe(false);
  });

  it("passes through types with no defined signature (e.g. CAD formats) without a false rejection", () => {
    const buffer = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    expect(verifyMagicBytes("application/octet-stream", buffer)).toBe(true);
  });
});
