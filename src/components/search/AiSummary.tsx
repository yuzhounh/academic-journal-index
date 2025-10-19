"use client";

import { useState, useEffect } from "react";
import type { Journal } from "@/data/journals";
import { getSummary } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";
import type { JournalSummaryInfo } from "@/app/actions";
import { useTranslation } from "@/i18n/provider";
import { BookCopy } from "lucide-react";
import { marked } from "marked";
import JournalListItem from "./JournalListItem";
import { journals } from "@/data/journals";

interface AiSummaryProps {
  journal: Journal;
  onJournalSelect: (journalName: string) => void;
}

export default function AiSummary({ journal, onJournalSelect }: AiSummaryProps) {
  const [summaryInfo, setSummaryInfo] = useState<JournalSummaryInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { locale, t } = useTranslation();

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result: JournalSummaryInfo = await getSummary(journal, locale);
        setSummaryInfo(result);
      } catch (e) {
        setError(t('journal.summaryError'));
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    if (journal) {
      fetchSummary();
    }
  }, [journal, locale, t]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
        </div>
        <div className="pt-4 space-y-2">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  const getSanitizedHtml = (markdown: string) => {
    try {
        return marked.parse(markdown);
    } catch (e) {
        return "Error parsing summary.";
    }
  };
  
  const relatedJournalsMap = new Map(journals.map(j => [j.issn.split('/')[0], j]));
  const fullRelatedJournals = (summaryInfo?.relatedJournals || [])
    .map(rj => relatedJournalsMap.get(rj.issn.split('/')[0]))
    .filter((j): j is Journal => !!j);


  return (
    <div className="space-y-6">
      {summaryInfo?.summary && (
        <div
            className="prose dark:prose-invert prose-headings:font-headline prose-headings:text-foreground max-w-none text-base text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: getSanitizedHtml(summaryInfo.summary) }}
        />
      )}

      {fullRelatedJournals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 font-headline">
            <BookCopy className="text-primary" />
            {t('journal.relatedJournals')}
          </h3>
          <div className="space-y-4">
            {fullRelatedJournals.map((relatedJournal) => (
                <JournalListItem
                    key={relatedJournal.issn}
                    journal={relatedJournal}
                    onClick={() => onJournalSelect(relatedJournal.journalName)}
                />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
