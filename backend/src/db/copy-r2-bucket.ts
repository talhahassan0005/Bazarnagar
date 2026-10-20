/**
 * Copy every image from the current R2 bucket (the R2_* values in .env) to
 * another R2 bucket/account — e.g. when moving storage to a new Cloudflare
 * account. The source bucket is only read, never changed.
 *
 * Each file is first saved to a local backup folder, then uploaded to the
 * target with the same key, content type and cache headers, and finally
 * every file's size is checked on the target. Safe to re-run: files already
 * on the target with the same size are skipped.
 *
 * Set the target in the shell (not in .env), then run:
 *   TARGET_R2_ACCOUNT_ID=... TARGET_R2_ACCESS_KEY_ID=... \
 *   TARGET_R2_SECRET_ACCESS_KEY=... TARGET_R2_BUCKET=bazaarnagar-images \
 *   npm run copy:r2
 *
 * Optional: BACKUP_DIR=/path/to/folder (default: ./r2-backup-<date>).
 */
import fs from "fs";
import path from "path";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";
import { env } from "../config/env";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before running this script.`);
  return value;
}

const r2Client = (accountId: string, accessKeyId: string, secretAccessKey: string) =>
  new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

async function listAll(s3: S3Client, bucket: string): Promise<_Object[]> {
  const out: _Object[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    out.push(...(page.Contents ?? []));
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/** Size of the object on the target, or null if it isn't there. */
async function targetSize(s3: S3Client, bucket: string, key: string): Promise<number | null> {
  try {
    return (await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))).ContentLength ?? 0;
  } catch {
    return null;
  }
}

async function copy(): Promise<void> {
  if (!env.r2Enabled) throw new Error("The source R2_* values in .env are not set.");
  const source = r2Client(env.r2.accountId, env.r2.accessKeyId, env.r2.secretAccessKey);
  const targetBucket = required("TARGET_R2_BUCKET");
  const target = r2Client(
    required("TARGET_R2_ACCOUNT_ID"),
    required("TARGET_R2_ACCESS_KEY_ID"),
    required("TARGET_R2_SECRET_ACCESS_KEY")
  );
  const backupDir = path.resolve(
    process.env.BACKUP_DIR ?? `r2-backup-${new Date().toISOString().slice(0, 10)}`
  );
  fs.mkdirSync(backupDir, { recursive: true });

  const objects = await listAll(source, env.r2.bucket);
  console.log(`Source ${env.r2.bucket}: ${objects.length} file(s). Backup folder: ${backupDir}`);

  let copied = 0;
  let skipped = 0;
  for (const o of objects) {
    const key = o.Key!;
    if ((await targetSize(target, targetBucket, key)) === o.Size) {
      skipped++;
      continue;
    }
    const got = await source.send(new GetObjectCommand({ Bucket: env.r2.bucket, Key: key }));
    const body = Buffer.from(await got.Body!.transformToByteArray());
    fs.writeFileSync(path.join(backupDir, key.replace(/[\\/:*?"<>|]/g, "_")), body);
    await target.send(
      new PutObjectCommand({
        Bucket: targetBucket,
        Key: key,
        Body: body,
        ContentType: got.ContentType ?? "application/octet-stream",
        CacheControl: got.CacheControl ?? "public, max-age=31536000, immutable",
      })
    );
    copied++;
    console.log(`  copied ${key}`);
  }

  let verified = 0;
  for (const o of objects) if ((await targetSize(target, targetBucket, o.Key!)) === o.Size) verified++;
  console.log(`\n✓ Copied ${copied}, already there ${skipped}. Verified on target: ${verified}/${objects.length}.`);
  if (verified !== objects.length) {
    console.log("Some files are missing on the target — run the script again.");
    process.exitCode = 1;
  }
}

copy().catch((err) => {
  console.error(err);
  process.exit(1);
});
