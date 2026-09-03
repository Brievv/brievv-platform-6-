import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuid } from "uuid";
import { env, isStorageConfigured } from "@/lib/env";

/**
 * S3-compatible object storage service. Works unmodified against AWS S3,
 * Cloudflare R2, or Supabase Storage — all three speak the S3 API, so only
 * S3_ENDPOINT / S3_REGION / credentials differ between them (spec §5, §18).
 *
 * Design decisions:
 *  - Files are NEVER proxied through the Next.js server. The browser
 *    uploads directly to storage using a short-lived presigned PUT URL
 *    (`createUploadUrl`), and downloads via a short-lived presigned GET
 *    URL (`createDownloadUrl`) — the app never returns a permanent public
 *    object URL (spec §18: "Do not expose private object-storage URLs").
 *  - Storage keys are server-generated (`buildObjectKey`), never derived
 *    from the client-supplied file name alone, to prevent path traversal
 *    and key collisions.
 */

export class StorageNotConfiguredError extends Error {
  constructor() {
    super(
      "Object storage is not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, and S3_BUCKET " +
        "in your environment (AWS S3, Cloudflare R2, or Supabase Storage all work — see .env.example)."
    );
    this.name = "StorageNotConfiguredError";
  }
}

let _client: S3Client | null = null;
function getClient(): S3Client {
  if (!isStorageConfigured()) throw new StorageNotConfiguredError();
  if (_client) return _client;
  _client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    credentials: { accessKeyId: env.S3_ACCESS_KEY!, secretAccessKey: env.S3_SECRET_KEY! },
    // R2/Supabase require path-style addressing; real AWS S3 works with both.
    forcePathStyle: true,
  });
  return _client;
}

/** Builds a namespaced, collision-resistant object key. Never trust a client-supplied key directly. */
export function buildObjectKey(params: { scope: "intake" | "projects" | "verification"; scopeId: string; fileName: string }): string {
  const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-140);
  return `${params.scope}/${params.scopeId}/${uuid()}-${safeName}`;
}

export async function createUploadUrl(params: { key: string; mimeType: string; maxSizeBytes?: number }): Promise<{ url: string; expiresInSeconds: number }> {
  const client = getClient();
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: params.key,
    ContentType: params.mimeType,
  });
  const expiresInSeconds = 300; // 5 minutes — long enough for a slow connection, short enough to limit exposure
  const url = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
  return { url, expiresInSeconds };
}

export async function createDownloadUrl(key: string, expiresInSeconds = 300): Promise<string> {
  const client = getClient();
  const command = new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(key: string): Promise<void> {
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}

/** Confirms an object actually exists (and reads its real size) after the client reports upload completion — never trust the client's self-reported size alone. */
export async function headObject(key: string): Promise<{ sizeBytes: number; contentType?: string } | null> {
  const client = getClient();
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    return { sizeBytes: res.ContentLength ?? 0, contentType: res.ContentType };
  } catch {
    return null;
  }
}
