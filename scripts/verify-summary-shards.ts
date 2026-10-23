import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import type { PackedSummaries } from "../src/data/summaries";
import type { SummaryManifest } from "../src/data/summary-store";
import { dataBucket } from "../src/lib/data-buckets";

const root = resolve(__dirname, ".."), directory = join(root, "src/data/summaries");
const source = readFileSync(join(root, "src/data/summaries.json.gz"));
const original = JSON.parse(gunzipSync(source).toString("utf8")) as PackedSummaries;
const digest = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const manifest = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8")) as SummaryManifest;
assert.equal(manifest.sourceSha256, digest(source));
assert.equal(manifest.sourceSha256, "f0036aa006ae7d414c56df38bcf9cbe799d0b120f41a20d66e749301b76f6a22");
const expected = new Map<string, PackedSummaries["entries"]>();
for (const [issn, entry] of Object.entries(original.entries)) {
  const bucket = dataBucket(issn), entries = expected.get(bucket) || {};
  entries[issn] = entry; expected.set(bucket, entries);
}
const sizes: number[] = [], expanded: number[] = [];
let total = 0;
for (const [bucket, entries] of expected) {
  const asset = manifest.assets[bucket], compressed = readFileSync(join(directory, "shards", asset.file));
  assert.equal(digest(compressed), asset.sha256);
  const json = gunzipSync(compressed);
  assert.deepEqual(JSON.parse(json.toString("utf8")).entries, entries, `Both languages and related records in ${bucket}`);
  sizes.push(compressed.length); expanded.push(json.length); total += Object.keys(entries).length;
}
assert.equal(total, Object.keys(original.entries).length);
const receipt = { sourceSha256: digest(source), originalCompressedBytes: source.length,
  originalJsonBytes: gunzipSync(source).length, entries: total, buckets: sizes.length,
  largestCompressedBucketBytes: Math.max(...sizes), largestJsonBucketBytes: Math.max(...expanded),
  decodedCacheLimit: 8, allBilingualContentAndRelatedRecordsEqual: true, modelCalls: 0,
  journalTableSha256: digest(readFileSync(join(root, "src/data/journals.json.gz"))), verifiedAt: new Date().toISOString() };
mkdirSync(join(root, "results"), { recursive: true });
writeFileSync(join(root, "results/summary-shards-verification.json"), JSON.stringify(receipt, null, 2) + "\n");
console.log(JSON.stringify(receipt));
