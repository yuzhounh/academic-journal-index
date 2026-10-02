

'use server';

/**
 * @fileOverview Reads pre-generated journal information without contacting a model service.
 *
 * - summarizeJournalInfo - A function that summarizes journal information.
 * - SummarizeJournalInfoInput - The input type for the summarizeJournalInfo function.
 * - SummarizeJournalInfoOutput - The return type for the summarizeJournalInfo function.
 */

import { z } from 'zod';
import { journals } from '@/data/journals';
import { getPrimaryIssn } from '@aji/core';
import { getStaticJournalSummary } from '@/data/summaries';

const SummarizeJournalInfoInputSchema = z.object({
  issn: z.string().trim().min(1).max(100),
  locale: z.enum(['en', 'zh']).describe('The locale for the output language.'),
});
export type SummarizeJournalInfoInput = z.infer<
  typeof SummarizeJournalInfoInputSchema
>;

const ContentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["heading"]),
    level: z.number().min(1).max(3).describe("The heading level (e.g., 2 for ##)."),
    content: z.string().describe("The text content of the heading."),
  }),
  z.object({
    type: z.enum(["paragraph"]),
    content: z.string().describe("The text content of the paragraph."),
  }),
  z.object({
    type: z.enum(["list"]),
    items: z.array(z.string()).describe("An array of strings, where each string is a list item."),
  }),
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

const SummarizeJournalInfoOutputSchema = z.object({
  summary: z.array(ContentBlockSchema).describe('A comprehensive summary of the journal covering its introduction, main publication areas, and status within its field, structured as an array of content blocks.'),
  relatedJournals: z.array(z.object({
    journalName: z.string().describe("The name of the related journal."),
    issn: z.string().describe("The ISSN of the related journal."),
  })).describe("A list of 6-9 journals related to the current one, drawn from your general knowledge.")
});
export type SummarizeJournalInfoOutput = z.infer<
  typeof SummarizeJournalInfoOutputSchema
>;

const journalMapByIssn = new Map(journals.map(journal => [getPrimaryIssn(journal.issn), journal]));

export async function summarizeJournalInfo(
  input: SummarizeJournalInfoInput
): Promise<SummarizeJournalInfoOutput> {
  const parsed = SummarizeJournalInfoInputSchema.safeParse(input);
  if (!parsed.success) return { summary: [], relatedJournals: [] };
  const { issn, locale } = parsed.data;
  const primaryIssn = getPrimaryIssn(issn);
  if (!journalMapByIssn.has(primaryIssn)) return { summary: [], relatedJournals: [] };
  const entry = getStaticJournalSummary(primaryIssn, locale);
  if (!entry) return { summary: [], relatedJournals: [] };
  const relatedJournals = entry.relatedJournals.flatMap(reference => {
    const journal = journalMapByIssn.get(getPrimaryIssn(reference.issn));
    return journal ? [{ journalName: journal.journalName, issn: journal.issn }] : [];
  });
  return { summary: entry.summary, relatedJournals };
}
