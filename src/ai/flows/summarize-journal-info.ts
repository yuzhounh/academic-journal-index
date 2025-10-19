'use server';

/**
 * @fileOverview Summarizes journal information, highlighting key metrics like impact factor and category rankings.
 *
 * - summarizeJournalInfo - A function that summarizes journal information.
 * - SummarizeJournalInfoInput - The input type for the summarizeJournalInfo function.
 * - SummarizeJournalInfoOutput - The return type for the summarizeJournalInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { journals } from '@/data/journals';
import type { Journal } from '@/data/journals';

const SummarizeJournalInfoInputSchema = z.object({
  journalName: z.string().describe('The name of the journal.'),
  locale: z.enum(['en', 'zh']).describe('The locale for the output language.'),
});
export type SummarizeJournalInfoInput = z.infer<
  typeof SummarizeJournalInfoInputSchema
>;

const ContentBlockSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading"),
    level: z.number().min(1).max(3).describe("The heading level (e.g., 2 for ##)."),
    content: z.string().describe("The text content of the heading."),
  }),
  z.object({
    type: z.literal("paragraph"),
    content: z.string().describe("The text content of the paragraph."),
  }),
  z.object({
    type: z.literal("list"),
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

export async function summarizeJournalInfo(
  input: SummarizeJournalInfoInput
): Promise<SummarizeJournalInfoOutput> {
  return summarizeJournalInfoFlow(input);
}

const summarizeJournalInfoPrompt = ai.definePrompt({
  name: 'summarizeJournalInfoPrompt',
  input: {schema: SummarizeJournalInfoInputSchema},
  output: {schema: SummarizeJournalInfoOutputSchema},
  prompt: `
    You are a professional academic journal analyst.
    Your task is to generate a detailed analysis report for the following journal.
    The entire report MUST be written in the language of the provided locale: {{{locale}}}.
    You MUST structure your output as a JSON object matching the provided schema.

    Journal Name: {{{journalName}}}

    The report should include the following sections, structured as content blocks:
    1. A heading for "Journal Introduction", followed by a paragraph providing background, history, and publisher info.
    2. A heading for "Main Publication Areas", followed by a list detailing the research directions and subject areas.
    3. A heading for "Status in the Field", followed by a paragraph analyzing the journal's position, academic reputation, and influence.

    Additionally, based on your own knowledge, recommend 6-9 related journals. Populate these recommendations into the 'relatedJournals' field, including their names and ISSNs.
  `,
});

const summarizeJournalInfoFlow = ai.defineFlow(
  {
    name: 'summarizeJournalInfoFlow',
    inputSchema: SummarizeJournalInfoInputSchema,
    outputSchema: SummarizeJournalInfoOutputSchema,
  },
  async input => {
    const {output} = await summarizeJournalInfoPrompt(input);
    if (!output) {
      return { summary: [], relatedJournals: [] };
    }

    // After getting AI suggestions, filter them to ensure they exist in our local data.
    const allKnownIssns = new Set(journals.map(j => j.issn.split('/')[0]));
    const journalMap = new Map(journals.map(j => [j.issn.split('/')[0], j]));
    
    const validatedRelatedJournals = output.relatedJournals
      .map(suggestedJournal => {
        const suggestedIssn = suggestedJournal.issn.split('/')[0];
        if (allKnownIssns.has(suggestedIssn)) {
          return journalMap.get(suggestedIssn);
        }
        return null;
      })
      .filter((j): j is Journal => !!j)
      .map(j => ({ journalName: j.journalName, issn: j.issn }));

    return {
      summary: output.summary,
      relatedJournals: validatedRelatedJournals,
    };
  }
);
