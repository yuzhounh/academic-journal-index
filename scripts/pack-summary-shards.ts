import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { packSummaryAssets } from "./summary-assets";
import type { SummaryManifest } from "../src/data/summary-store";

const root = resolve(__dirname, ".."), directory = join(root, "src/data/summaries");
const source = readFileSync(join(root, "src/data/summaries.json.gz"));
const digest = (value: Buffer) => createHash("sha256").update(value).digest("hex");
const input = createHash("sha256").update(source);
for (const file of [__filename, join(root, "scripts/summary-assets.ts"), join(root, "src/lib/data-buckets.ts")]) input.update(readFileSync(file));
const key = input.digest("hex");
let reusable = false;
try {
  const previous = JSON.parse(readFileSync(join(directory, "manifest.json"), "utf8")) as SummaryManifest;
  reusable = readFileSync(join(directory, ".pack-key"), "utf8") === key && previous.sourceSha256 === digest(source) &&
    Object.values(previous.assets).every(asset => /^[a-f0-9]{64}$/.test(asset.sha256) &&
      /^summary\.[a-f0-9]{2}\.[a-f0-9]{64}\.json\.gz$/.test(asset.file) &&
      digest(readFileSync(join(directory, "shards", asset.file))) === asset.sha256);
} catch { /* A missing/stale generated package is rebuilt from the intact canonical input. */ }
if (reusable) console.log("Reused verified summary buckets (data and packer inputs unchanged)");
else {
  const manifest = packSummaryAssets(root, source);
  writeFileSync(join(directory, ".pack-key"), key);
  console.log(`Packed ${manifest.total} existing bilingual summaries into ${Object.keys(manifest.assets).length} buckets`);
}
