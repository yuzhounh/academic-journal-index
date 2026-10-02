/** Pre-generated bilingual summaries shared with AJI Editions; server-side only. */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export type SummaryContentBlock =
  | { type: 'heading'; level: number; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] };

export type StaticJournalSummary = {
  summary: SummaryContentBlock[];
  relatedJournals: { journalName: string; issn: string }[];
};

type PackedSummaries = {
  version: string;
  model: string;
  updatedAt: string;
  total: number;
  entries: Record<string, {
    en: { summary: SummaryContentBlock[] };
    zh: { summary: SummaryContentBlock[] };
    related: StaticJournalSummary['relatedJournals'];
  }>;
};

let collection: PackedSummaries | undefined;

export function getStaticJournalSummary(primaryIssn: string, locale: 'en' | 'zh'): StaticJournalSummary | undefined {
  if (!collection) {
    const file = path.resolve(process.cwd(), 'src/data/summaries.json.gz');
    collection = JSON.parse(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')) as PackedSummaries;
  }
  if (!Object.hasOwn(collection.entries, primaryIssn)) return undefined;
  const entry = collection.entries[primaryIssn];
  return { summary: entry[locale].summary, relatedJournals: entry.related };
}
