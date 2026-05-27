/**
 * Mirror all Vercel Blob assets to a local folder.
 *
 * Lists every blob in the store, downloads them in parallel batches,
 * and writes a manifest.json with metadata (URL, size, uploadedAt).
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=... npx tsx scripts/backup/mirror-blob.ts ./blobs
 */
import "dotenv/config";
import { list } from "@vercel/blob";
import { mkdirSync, writeFileSync, createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

async function main() {
  const outDir = process.argv[2] ?? "./blobs";
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Missing BLOB_READ_WRITE_TOKEN");
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });

  // 1. Enumerate all blobs (paginated)
  let cursor: string | undefined;
  const all: {
    pathname: string;
    url: string;
    size: number;
    uploadedAt: string;
  }[] = [];
  do {
    const page = await list({ cursor, limit: 1000, token });
    for (const b of page.blobs) {
      all.push({
        pathname: b.pathname,
        url: b.url,
        size: b.size,
        uploadedAt: b.uploadedAt.toISOString(),
      });
    }
    cursor = page.cursor;
  } while (cursor);

  console.error(`→ ${all.length} blobs to mirror`);

  // 2. Write manifest first (so even if downloads fail we keep URLs)
  writeFileSync(
    join(outDir, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalCount: all.length,
        totalBytes: all.reduce((s, b) => s + b.size, 0),
        blobs: all,
      },
      null,
      2
    )
  );

  // 3. Download in parallel batches (concurrency 8, polite to Vercel)
  const CONCURRENCY = 8;
  let done = 0;
  let failed = 0;

  async function downloadOne(blob: (typeof all)[number]) {
    try {
      const dest = join(outDir, "files", blob.pathname);
      mkdirSync(dirname(dest), { recursive: true });
      const res = await fetch(blob.url);
      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }
      await pipeline(
        Readable.fromWeb(res.body as never),
        createWriteStream(dest)
      );
      done++;
      if (done % 50 === 0) {
        console.error(`  ${done}/${all.length}`);
      }
    } catch (e) {
      failed++;
      console.error(`  ✗ ${blob.pathname}: ${(e as Error).message}`);
    }
  }

  for (let i = 0; i < all.length; i += CONCURRENCY) {
    const batch = all.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(downloadOne));
  }

  console.error(
    `✓ Mirrored ${done}/${all.length} blobs (${failed} failed) to ${outDir}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
