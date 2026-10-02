import assert from 'node:assert/strict';
import test from 'node:test';
import { getPrimaryIssn } from '@aji/core';
import { journals } from '../src/data/journals';
import { getStaticJournalSummary } from '../src/data/summaries';
import { getSummary } from '../src/app/actions';
import { summarizeJournalInfo } from '../src/ai/flows/summarize-journal-info';

test('actual action serves bilingual stored summaries without a model key or network', async () => {
  const originalFetch = globalThis.fetch;
  const key = process.env.DEEPSEEK_API_KEY;
  let requests = 0;
  delete process.env.DEEPSEEK_API_KEY;
  globalThis.fetch = async () => { requests++; throw new Error('Network forbidden in offline summary test'); };
  try {
    const nature = journals.find(journal => journal.journalName.toLowerCase() === 'nature');
    assert.ok(nature);
    const en = await getSummary(nature, 'en');
    const zh = await getSummary(nature, 'zh');
    assert.ok(en.summary.length > 0);
    assert.ok(zh.summary.length > 0);
    assert.notDeepEqual(zh.summary, en.summary);
    assert.deepEqual(en.summary, getStaticJournalSummary(getPrimaryIssn(nature.issn), 'en')?.summary);
    assert.deepEqual(zh.summary, getStaticJournalSummary(getPrimaryIssn(nature.issn), 'zh')?.summary);
    const known = new Map(journals.map(journal => [journal.issn, journal.journalName]));
    assert.ok(en.relatedJournals.length > 0);
    for (const related of en.relatedJournals) assert.equal(known.get(related.issn), related.journalName);
    assert.equal(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (key === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = key;
  }
});

test('unknown identifiers and invalid languages have no realtime fallback', async () => {
  assert.equal(getStaticJournalSummary('0000-0000', 'zh'), undefined);
  for (const input of [
    { issn: '0000-0000', locale: 'zh' },
    { issn: '__proto__', locale: 'en' },
    { issn: '0028-0836', locale: 'invalid' },
    { issn: '', locale: 'en' },
  ]) {
    assert.deepEqual(await summarizeJournalInfo(input as Parameters<typeof summarizeJournalInfo>[0]),
      { summary: [], relatedJournals: [] });
  }
});
