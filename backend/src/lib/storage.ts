import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "../config/env";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

let client: S3Client | null = null;

/** Lazily-built S3 client pointed at the Cloudflare R2 endpoint. */
function r2(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }
  return client;
}

/** Upload a buffer to R2 under `key` and return its public URL. */
export async function putR2Object(key: string, body: Buffer, contentType: string): Promise<string> {
  await r2().send(
    new PutObjectCommand({
      Bucket: env.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Filenames are unique per upload, so the object never changes.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${env.r2.publicUrl}/${key}`;
}

/**
 * Persist an uploaded image and return its publicly reachable URL — on R2 when
 * configured, otherwise in the local uploads folder.
 */
export async function saveImage(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

  if (env.r2Enabled) return putR2Object(filename, file.buffer, file.mimetype);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return `${env.publicUrl.replace(/\/$/, "")}/uploads/${filename}`;
}
