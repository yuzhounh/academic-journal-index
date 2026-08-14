/**
 * @fileoverview Loads the pre-built journal dataset on the server side.
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import type { Journal, JournalDataset } from "./types";

export type { Journal, JournalDataset, MinorCategory } from "./types";

function loadJournals(): Journal[] {
  const gzPath = path.resolve(process.cwd(), "src/data/journals.json.gz");

  if (!fs.existsSync(gzPath)) {
    throw new Error(
      "Missing src/data/journals.json.gz. Run `npm run build:journals` first."
    );
  }

  const compressed = fs.readFileSync(gzPath);
  const json = zlib.gunzipSync(compressed).toString("utf8");
  const dataset = JSON.parse(json) as JournalDataset;

  return dataset.journals.filter((journal) => journal.journalName);
}

export const journals = loadJournals();
