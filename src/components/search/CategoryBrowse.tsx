"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useTranslation } from "@/i18n/provider";
import { getMajorCategoryName } from "@/i18n/categories";
import { getCategoryGridSpan, getCategoryMeta } from "@/lib/category-meta";
import { cn } from "@/lib/utils";

interface CategoryBrowseProps {
  categories: [string, number][];
  onCategorySelect: (category: string) => void;
}

export default function CategoryBrowse({ categories, onCategorySelect }: CategoryBrowseProps) {
  const { t, locale } = useTranslation();
  const [filter, setFilter] = useState("");

  const maxCount = categories[0]?.[1] ?? 0;

  const filteredCategories = useMemo(() => {
    if (!filter.trim()) return categories;
    const term = filter.toLowerCase();
    return categories.filter(([category]) => {
      const localized = getMajorCategoryName(category, locale).toLowerCase();
      return localized.includes(term) || category.toLowerCase().includes(term);
    });
  }, [categories, filter, locale]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      <div className="space-y-2">
        <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">
          {t("categories.browseTitle")}
        </h2>
        <p className="text-muted-foreground">{t("categories.browseSubtitle")}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("categories.filterPlaceholder")}
          className="pl-9 rounded-xl"
          aria-label={t("categories.filterPlaceholder")}
        />
      </div>

      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {t("categories.noMatch")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {filteredCategories.map(([category, count]) => {
            const meta = getCategoryMeta(category);
            const Icon = meta.icon;
            const spanClass = getCategoryGridSpan(count, maxCount);

            return (
              <Card
                key={category}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:ring-primary/30 flex flex-col group",
                  spanClass
                )}
                onClick={() => onCategorySelect(category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105", meta.bgClass)}>
                      <Icon className={cn("h-5 w-5", meta.accentClass)} />
                    </div>
                    <CardTitle className="font-headline text-lg leading-snug pt-1">
                      {getMajorCategoryName(category, locale)}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold tabular-nums text-foreground">{count}</span>{" "}
                    {t("categories.journals")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
