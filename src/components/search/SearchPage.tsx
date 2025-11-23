

"use client";

import * as React from "react";
import { useState, useMemo, ChangeEvent, useEffect } from "react";
import type { Journal } from "@/data/journals";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, Download } from "lucide-react";
import CategoryStats from "./CategoryStats";
import { useTranslation } from "@/i18n/provider";
import JournalListItem from "./JournalListItem";
import { useIsMobile } from "@/hooks/use-is-mobile";
import Papa from "papaparse";
import { Button } from "../ui/button";

interface SearchPageProps {
  journals: Journal[];
  onJournalSelect: (journal: Journal, searchTerm: string) => void;
  initialSearchTerm?: string;
}

const JOURNALS_PER_PAGE = 20;

// Helper function to generate pagination items
const getPaginationItems = (
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void,
  isMobile: boolean = false
) => {
  const range = (start: number, end: number) => {
    if (start > end) return [];
    const length = end - start + 1;
    return Array.from({ length }, (_, i) => start + i);
  };

  const renderPage = (pageNumber: number) => (
    <PaginationItem key={pageNumber}>
      <PaginationLink
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onPageChange(pageNumber);
        }}
        isActive={currentPage === pageNumber}
      >
        {pageNumber}
      </PaginationLink>
    </PaginationItem>
  );

  if (isMobile) {
    if (totalPages <= 5) {
      return range(1, totalPages).map(p => renderPage(p));
    }
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (currentPage <= 2) {
        startPage = 1;
        endPage = 5;
    }
    if (currentPage > totalPages - 3) {
        startPage = totalPages - 4;
        endPage = totalPages;
    }
    return range(startPage, endPage).map(p => renderPage(p));
  }

  const pages: React.ReactNode[] = [];
  const pageLimit = 3; 
  const middleLimit = 7; 

  const renderEllipsis = (key: string) => (
    <PaginationItem key={key}>
      <PaginationEllipsis />
    </PaginationItem>
  );

  if (totalPages <= 2 * pageLimit + middleLimit - 2) {
    return range(1, totalPages).map((p) => renderPage(p));
  }

  // Start pages
  pages.push(...range(1, pageLimit).map((p) => renderPage(p)));

  // Ellipsis or middle pages
  const middleStart = Math.max(pageLimit + 1, currentPage - Math.floor((middleLimit - 1) / 2));
  const middleEnd = Math.min(totalPages - pageLimit, currentPage + Math.floor((middleLimit - 1) / 2));

  if (middleStart > pageLimit + 1) {
    pages.push(renderEllipsis("start-ellipsis"));
  }

  pages.push(...range(middleStart, middleEnd).map((p) => renderPage(p)));
  
  if (middleEnd < totalPages - pageLimit) {
     pages.push(renderEllipsis("end-ellipsis"));
  }

  // End pages
  pages.push(...range(totalPages - pageLimit + 1, totalPages).map((p) => renderPage(p)));

  // De-duplicate pages
  const pageKeys = new Set();
  const uniquePages = pages.filter(item => {
    if (React.isValidElement(item)) {
        if (!pageKeys.has(item.key)) {
            pageKeys.add(item.key);
            return true;
        }
    }
    return false;
  });

  return uniquePages;
};

const triggerCsvDownload = (data: (string | number)[][], filename: string) => {
  const csvContent = "data:text/csv;charset=utf-8," + Papa.unparse(data);
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link); // Required for FF
  link.click();
  document.body.removeChild(link);
};


function SearchClient({ journals, onJournalSelect, initialSearchTerm = "" }: SearchPageProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
    if (initialSearchTerm) {
        setCurrentPage(1);
    }
  }, [initialSearchTerm]);

  const filteredJournals = useMemo(() => {
    if (searchTerm.length < 3) {
      return [];
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return journals
      .filter((journal) =>
        journal.journalName.toLowerCase().includes(lowercasedTerm)
      )
      .sort((a, b) => {
        const factorA = typeof a.impactFactor === 'number' ? a.impactFactor : 0;
        const factorB = typeof b.impactFactor === 'number' ? b.impactFactor : 0;
        return factorB - factorA;
      });
  }, [searchTerm, journals]);

  const totalPages = Math.ceil(filteredJournals.length / JOURNALS_PER_PAGE);

  const paginatedJournals = useMemo(() => {
    const startIndex = (currentPage - 1) * JOURNALS_PER_PAGE;
    return filteredJournals.slice(startIndex, startIndex + JOURNALS_PER_PAGE);
  }, [filteredJournals, currentPage]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  const handleExport = () => {
    if (filteredJournals.length === 0) return;
    
    const filename = `Search-results-for-${searchTerm.replace(/\s+/g, '_')}.csv`;
    const headers = ["Journal Name", "ISSN/EISSN", "Impact Factor", "CAS Partition", "Authority Level", "Open Access"];
    const data = filteredJournals.map(j => [
        j.journalName,
        j.issn,
        j.impactFactor,
        j.majorCategoryPartition,
        j.authorityJournal,
        j.openAccess
    ]);

    triggerCsvDownload([headers, ...data], filename);
  };

  const showInitialMessage = searchTerm.length < 3;
  const showNoResultsMessage = searchTerm.length >= 3 && filteredJournals.length === 0;

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('search.placeholder')}
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 h-12 text-lg shadow-md focus-visible:shadow-lg transition-shadow"
          aria-label={t('search.ariaLabel')}
        />
      </div>

      {filteredJournals.length > 0 && (
        <div className="mb-8 animate-in fade-in-50 duration-300 space-y-6">
          <div className="flex justify-end">
             <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                {t('common.exportCsv')}
            </Button>
          </div>
          <CategoryStats journals={filteredJournals} />
        </div>
      )}

      {showInitialMessage && (
          <div className="text-center py-20 px-4 border-2 border-dashed rounded-lg">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium text-foreground">{t('search.initial.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                  {t('search.initial.description')}
              </p>
          </div>
      )}
      {showNoResultsMessage && (
          <div className="text-center py-10">
              <p className="text-muted-foreground">{t('search.noResults', { searchTerm })}</p>
          </div>
      )}

      {paginatedJournals.length > 0 && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          {paginatedJournals.map((journal) => (
            <JournalListItem
              key={journal.issn}
              journal={journal}
              onClick={() => onJournalSelect(journal, searchTerm)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-8">
            {isMobile ? (
              <div className="w-full flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {t('pagination.total')} {totalPages} {t('pagination.pages')}
                  </p>
                  <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        >
                            {t('pagination.previous')}
                        </PaginationPrevious>
                      </PaginationItem>
                      {getPaginationItems(currentPage, totalPages, handlePageChange, true)}
                      <PaginationItem>
                        <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                            aria-disabled={currentPage === totalPages}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        >
                            {t('pagination.next')}
                        </PaginationNext>
                      </PaginationItem>
                  </PaginationContent>
              </div>
            ) : (
              <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                    }}
                    aria-disabled={currentPage === 1}
                    className={
                        currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    >
                      {t('pagination.previous')}
                    </PaginationPrevious>
                </PaginationItem>

                {getPaginationItems(currentPage, totalPages, handlePageChange)}

                <PaginationItem>
                    <PaginationNext
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={
                        currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    >
                      {t('pagination.next')}
                    </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            )}
        </Pagination>
      )}
    </div>
  );
}

export default function SearchPage({ journals, onJournalSelect, initialSearchTerm = "" }: SearchPageProps) {
  return <SearchClient journals={journals} onJournalSelect={onJournalSelect} initialSearchTerm={initialSearchTerm} />;
}

    
