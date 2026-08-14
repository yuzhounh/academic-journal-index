import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface AjiLogoIconProps {
  className?: string;
}

export function AjiLogoIcon({ className }: AjiLogoIconProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-sm",
        className
      )}
    >
      <BookOpen className="h-5 w-5" strokeWidth={2.25} />
    </div>
  );
}

interface AjiLogoProps {
  className?: string;
  showLabel?: boolean;
}

export function AjiLogo({ className, showLabel = true }: AjiLogoProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <AjiLogoIcon />
      {showLabel && <span className="text-xl font-bold font-headline">AJI</span>}
    </span>
  );
}
