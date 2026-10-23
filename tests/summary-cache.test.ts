import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { packSummaryAssets } from "../scripts/summary-assets";
import { createSummaryStore } from "../src/data/summary-store";
import { dataBucket } from "../src/lib/data-buckets";

test("summary reads share one bucket across languages, evict old data, retry failures and reject inherited IDs", t => {
  const temporary = resolve(__dirname, "../tmp/tests"); mkdirSync(temporary, { recursive: true });
  const root = mkdtempSync(join(temporary, "summary-"));
  t.after(() => { assert.ok(resolve(root).startsWith(temporary + sep)); rmSync(root, { recursive: true, force: true }); });
  const keys = ["1234-5678", "1111-1111", "2222-2222"];
  assert.equal(new Set(keys.map(key => dataBucket(key))).size, 3);
  const entries = Object.fromEntries(keys.map(key => [key, {
    en: { summary: [{ type: "paragraph", content: `English ${key}` }] },
    zh: { summary: [{ type: "paragraph", content: `中文 ${key}` }] }, related: [{ journalName: "Related", issn: "9999-9999" }],
  }]));
  const manifest = packSummaryAssets(root, gzipSync(JSON.stringify({ version: "fixture", model: "existing", updatedAt: "2026-01-01", total: 3, entries })));
  // Include the prototype-key bucket even if no fixture ISSN naturally hashes into it.
  const asset = Object.values(manifest.assets)[0];
  const originalRead = (file: string) => readFileSync(file);
  const reads: string[] = []; let fail = true;
  const store = createSummaryStore(join(root, "src/data/summaries"), 2, file => {
    reads.push(file);
    if (file.endsWith(".gz") && fail) { fail = false; throw new Error("temporary read failure"); }
    if (file.endsWith("manifest.json")) return Buffer.from(JSON.stringify({ ...manifest, assets: {
      ...manifest.assets, [dataBucket("__proto__")]: { ...asset,
        file: `summary.${dataBucket("__proto__")}.${asset.sha256}.json.gz` },
    } }));
    if (file.includes(`summary.${dataBucket("__proto__")}.`) && !Object.hasOwn(manifest.assets, dataBucket("__proto__"))) {
      return originalRead(join(root, "src/data/summaries/shards", asset.file));
    }
    return originalRead(file);
  });
  assert.throws(() => store(keys[0], "en"), /temporary/);
  assert.deepEqual(store(keys[0], "en"), { summary: entries[keys[0]].en.summary, relatedJournals: entries[keys[0]].related });
  const count = reads.length;
  assert.deepEqual(store(keys[0], "zh")?.summary, entries[keys[0]].zh.summary);
  assert.equal(reads.length, count);
  store(keys[1], "en"); store(keys[2], "en"); store(keys[0], "en");
  assert.equal(reads.filter(file => file.endsWith(".gz")).length, 5);
  assert.equal(store("__proto__", "en"), undefined);
  assert.equal(store(keys[0], "invalid" as "en"), undefined);
  assert.ok(!reads.some(file => file.endsWith("summaries.json.gz")));
});
