/**
 * Upload validation. Per spec §71: "Never trust a filename extension
 * alone." We check the declared extension AND the declared MIME type
 * against an allow-list, and (where a magic-byte signature is easy to
 * verify) confirm the first bytes of the file match what's claimed.
 *
 * The signature check runs client-side before requesting a presigned
 * URL (fast feedback) AND should be re-run server-side once the object
 * exists in storage, by fetching the first few bytes via a ranged GET —
 * see TODO in the upload-confirm route. Client-side validation alone is
 * a UX convenience, not a security boundary.
 */

export const ALLOWED_UPLOAD_TYPES: Record<string, { extensions: string[]; maxSizeBytes: number; magicBytes?: number[][] }> = {
  "application/pdf": { extensions: [".pdf"], maxSizeBytes: 100 * 1024 * 1024, magicBytes: [[0x25, 0x50, 0x44, 0x46]] },
  "image/jpeg": { extensions: [".jpg", ".jpeg"], maxSizeBytes: 25 * 1024 * 1024, magicBytes: [[0xff, 0xd8, 0xff]] },
  "image/png": { extensions: [".png"], maxSizeBytes: 25 * 1024 * 1024, magicBytes: [[0x89, 0x50, 0x4e, 0x47]] },
  "application/zip": { extensions: [".zip"], maxSizeBytes: 500 * 1024 * 1024, magicBytes: [[0x50, 0x4b, 0x03, 0x04]] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extensions: [".docx"], maxSizeBytes: 50 * 1024 * 1024 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { extensions: [".xlsx"], maxSizeBytes: 50 * 1024 * 1024 },
  // AEC-specific formats — MIME types are frequently unreliable/absent for these in
  // browser upload dialogs, so extension + size are the primary checks.
  "application/acad": { extensions: [".dwg"], maxSizeBytes: 200 * 1024 * 1024 },
  "image/vnd.dwg": { extensions: [".dwg"], maxSizeBytes: 200 * 1024 * 1024 },
  "application/dxf": { extensions: [".dxf"], maxSizeBytes: 200 * 1024 * 1024 },
  "application/octet-stream": { extensions: [".dwg", ".dxf", ".rvt", ".ifc"], maxSizeBytes: 500 * 1024 * 1024 },
};

export interface FileValidationInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface FileValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateUploadRequest(input: FileValidationInput): FileValidationResult {
  const ext = extractExtension(input.fileName);
  if (!ext) return { valid: false, reason: "File has no extension." };

  const rule = ALLOWED_UPLOAD_TYPES[input.mimeType];
  if (!rule) {
    return { valid: false, reason: `File type "${input.mimeType}" is not supported.` };
  }
  if (!rule.extensions.includes(ext)) {
    return { valid: false, reason: `Extension "${ext}" doesn't match declared type "${input.mimeType}".` };
  }
  if (input.sizeBytes <= 0) {
    return { valid: false, reason: "File appears to be empty." };
  }
  if (input.sizeBytes > rule.maxSizeBytes) {
    return { valid: false, reason: `File exceeds the ${Math.round(rule.maxSizeBytes / (1024 * 1024))}MB limit for this type.` };
  }
  return { valid: true };
}

function extractExtension(fileName: string): string | null {
  const match = /\.[a-zA-Z0-9]+$/.exec(fileName);
  return match ? match[0].toLowerCase() : null;
}

/** Verifies the first bytes of a buffer match one of the expected magic-byte signatures for the declared MIME type, when one is defined. Returns true when no signature is defined for that type (e.g. CAD formats), since we then rely on extension + size only. */
export function verifyMagicBytes(mimeType: string, buffer: Uint8Array): boolean {
  const rule = ALLOWED_UPLOAD_TYPES[mimeType];
  if (!rule?.magicBytes) return true;
  return rule.magicBytes.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}
