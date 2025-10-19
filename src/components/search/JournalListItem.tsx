
"use client";

import { type Journal } from "@/data/journals";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Medal, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/provider";

interface JournalListItemProps {
  journal: Journal;
  onClick: () => void;
  searchTerm?: string;
}

const getPartitionColorClass = (partition: string): string => {
  const mainPartition = partition.charAt(0);
  switch (mainPartition) {
    case "1":
      return "text-red-500";
    case "2":
      return "text-orange-500";
    case "3":
      return "text-yellow-600";
    case "4":
      return "text-green-600";
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

const formatIssn = (issn: string) => {
    const parts = issn.split('/');
    if (parts.length > 1) {
        return (
            <>
                <span className="inline-block">{parts[0]}</span>
                <span className="inline-block">/{parts.slice(1).join('/')}</span>
            </>
        );
    }
    return <span className="inline-block">{issn}</span>;
};

export default function JournalListItem({ journal, onClick }: JournalListItemProps) {
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

  return (
    <Card
      className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-6 grid grid-cols-12 items-start gap-4">
        <div className="col-span-7">
          <p className="font-headline text-lg font-semibold truncate">{journal.journalName}</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-muted-foreground font-mono w-[150px]">{formatIssn(journal.issn)}</p>
            <AuthorityBadge level={journal.authorityJournal} />
            {journal.openAccess === "是" && <Badge variant="openAccess">{t('journal.oa')}</Badge>}
          </div>
        </div>
        <div className="col-span-2 text-center">
          <p className="text-xs text-muted-foreground font-semibold">{t('journal.impactFactor')}</p>
          <p className="font-medium text-lg">{formatImpactFactor(journal.impactFactor)}</p>
        </div>
        <div className="col-span-3 flex flex-col items-center justify-center text-center">
          <p className="text-xs text-muted-foreground font-semibold mb-1">{t('journal.casPartitionShort')}</p>
          <div className={cn("flex items-center font-semibold text-base", getPartitionColorClass(journal.majorCategoryPartition))}>
            <span className="ml-1">{getPartitionText(journal.majorCategoryPartition)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
