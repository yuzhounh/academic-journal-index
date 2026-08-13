"use client";

import { type Journal } from "@/data/journals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";
import { Checkbox } from "../ui/checkbox";

interface JournalListItemProps {
  journal: Journal;
  onClick: () => void;
  isEditing?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

const getPartitionColorClass = (partition: string): string => {
  const mainPartition = partition.charAt(0);
  switch (mainPartition) {
    case "1":
      return "text-partition-q1";
    case "2":
      return "text-partition-q2";
    case "3":
      return "text-partition-q3";
    case "4":
      return "text-partition-q4";
    default:
      return "text-muted-foreground";
  }
};

const AuthorityBadge = ({ level }: { level: string }) => {
    const { t } = useTranslation();
    let icon;
    let variant: "authority1" | "authority2" | "authority3" | "secondary" = "secondary";
    let levelText = level;
    if (level === "一级") levelText = t('cas.authority.1');
    if (level === "二级") levelText = t('cas.authority.2');
    if (level === "三级") levelText = t('cas.authority.3');

    switch (level) {
        case "一级":
            icon = <Crown className="h-3 w-3" />;
            variant = "authority1";
            break;
        case "二级":
            icon = <Medal className="h-3 w-3" />;
            variant = "authority2";
            break;
        case "三级":
            icon = <Star className="h-3 w-3" />;
            variant = "authority3";
            break;
        default:
            return null;
    }
    return (
        <Badge variant={variant} className="gap-1 pl-1 pr-1.5">
            {icon}
            <span className="text-xs whitespace-nowrap">{levelText}</span>
        </Badge>
    )
}

const formatImpactFactor = (factor: number | string) => {
    const num = Number(factor);
    if (!isNaN(num) && String(factor).trim() !== "" && !String(factor).includes('<')) {
      return num.toFixed(1);
    }
    return factor;
};

// This function now adds a hidden placeholder if only ISSN exists
// to ensure the authority badge aligns correctly.
const formatIssn = (issn: string) => {
  const hasEissn = issn.includes('/');
  return (
    <>
      <span>{issn}</span>
      {!hasEissn && (
        <span style={{ visibility: 'hidden' }}>/0000-0000</span>
      )}
    </>
  );
};

export default function JournalListItem({ journal, onClick, isEditing, isSelected, onSelectionChange }: JournalListItemProps) {
  const { t, locale } = useTranslation();

  const getPartitionText = (partition: string) => {
    if (locale === 'zh') {
        const mainPartition = partition.charAt(0);
        switch (mainPartition) {
            case '1': return t('cas.partitions.1');
            case '2': return t('cas.partitions.2');
            case '3': return t('cas.partitions.3');
            case '4': return t('cas.partitions.4');
            default: return partition;
        }
    }
    const match = partition.match(/(\d+)/);
    return match ? `Q${match[1]}` : partition;
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isEditing) {
        // Prevent click from propagating to anything behind the checkbox
        if (e.target instanceof HTMLInputElement) return;
        onSelectionChange?.(!isSelected);
    } else {
        onClick();
    }
};

  return (
    <Card
      className={cn("cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:ring-primary/30", isSelected && "ring-2 ring-primary shadow-card-hover")}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 md:p-6 flex items-center gap-4">
        {isEditing && (
            <Checkbox
                checked={isSelected}
                onCheckedChange={onSelectionChange}
                className="h-5 w-5"
                aria-label={`Select journal ${journal.journalName}`}
            />
        )}
        <div className="flex flex-col md:grid md:grid-cols-12 md:items-start md:gap-4 w-full">
            {/* Left side: Title and metadata */}
            <div className="md:col-span-7">
              <p className="font-headline text-lg font-semibold">{journal.journalName}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                <p className="font-mono whitespace-nowrap">{formatIssn(journal.issn)}</p>
                <div className="flex items-center gap-2">
                    <AuthorityBadge level={journal.authorityJournal} />
                    {journal.openAccess === "是" && <Badge variant="openAccess">{t('journal.oa')}</Badge>}
                </div>
              </div>
            </div>

            {/* Divider for mobile view */}
            <div className="h-px bg-border my-3 md:hidden"></div>

            {/* Right side: Stats */}
            <div className="md:col-span-5 w-full flex justify-around md:justify-end items-start gap-4">
                <div className="text-center md:w-1/2">
                    <p className="text-xs text-muted-foreground font-semibold">{t('journal.impactFactor')}</p>
                    <p className="font-medium text-base">{formatImpactFactor(journal.impactFactor)}</p>
                </div>
                <div className="text-center md:w-1/2">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">{t('journal.casPartitionShort')}</p>
                    <div className={cn("flex items-center justify-center font-semibold text-base", getPartitionColorClass(journal.majorCategoryPartition))}>
                        <span className="ml-1">{getPartitionText(journal.majorCategoryPartition)}</span>
                    </div>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
