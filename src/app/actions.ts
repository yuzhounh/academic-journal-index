'use server';

import type { Journal } from '@/data/journals';
import {
  summarizeJournalInfo,
  type SummarizeJournalInfoOutput,
} from '@/ai/flows/summarize-journal-info';
export type { ContentBlock } from '@/ai/flows/summarize-journal-info';

export type JournalSummaryInfo = SummarizeJournalInfoOutput;

export async function getSummary(
  journal: Journal,
  locale: 'en' | 'zh'
): Promise<JournalSummaryInfo> {
  const summary = await summarizeJournalInfo({
    issn: journal.issn,
    locale: locale,
  });

  return summary;
}
