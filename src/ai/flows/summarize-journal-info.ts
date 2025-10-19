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

const SummarizeJournalInfoOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the journal covering its introduction, main publication areas, and status within its field. The output should be formatted in Markdown, using headings, lists, and bold text for clarity.'),
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

    Journal Name: {{{journalName}}}

    The report should include the following sections, formatted in Markdown for readability (e.g., using headings like '##', lists with '-', and bold text with '**').

    Report Structure:
    ## Journal Introduction
       [Provide a background, history, and publisher introduction for the journal here]

    ## Main Publication Areas
       [Detail the research directions and subject areas covered by the journal, using a bulleted list]

    ## Status in the Field
       [Analyze the journal's position in its academic field, combining its academic reputation, common metrics, and influence]

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
      return { summary: '', relatedJournals: [] };
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
