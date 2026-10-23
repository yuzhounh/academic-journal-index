/** Pre-generated bilingual summaries shared with AJI Editions; server-side only. */
import path from 'node:path';
import { createSummaryStore } from './summary-store';

export type SummaryContentBlock =
  | { type: 'heading'; level: number; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] };

export type StaticJournalSummary = {
  summary: SummaryContentBlock[];
  relatedJournals: { journalName: string; issn: string }[];
};

export type PackedSummaries = {
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

const getSummary = createSummaryStore(path.resolve(process.cwd(), 'src/data/summaries'));

export function getStaticJournalSummary(primaryIssn: string, locale: 'en' | 'zh'): StaticJournalSummary | undefined {
  return getSummary(primaryIssn, locale);
}
