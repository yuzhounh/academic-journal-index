export type MinorCategory = {
  name: string;
  partition: string;
};

export type Journal = {
  journalName: string;
  year: number;
  issn: string;
  review: string;
  oaj: string;
  openAccess: string;
  webOfScience: string;
  impactFactor: number | string;
  annotation: string;
  majorCategory: string;
  majorCategoryPartition: string;
  top: string;
  authorityJournal: string;
  minorCategories: MinorCategory[];
};

export type JournalDataset = {
  version: string;
  partitionYear: number;
  impactFactorYear: number;
  source: {
    partition: string;
    impactFactor: string;
  };
  generatedAt: string;
  journalCount: number;
  journals: Journal[];
};
