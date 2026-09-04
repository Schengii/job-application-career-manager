"use client";

// -----------------------------------------------------------------------------
// Kleine wiederverwendbare Seiten-Navigation für paginierte Listen (siehe
// src/lib/apiUtils.ts `PaginatedResult<T>`).
// -----------------------------------------------------------------------------
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/core/utils";

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-1 py-2 text-xs text-muted-foreground",
        className
      )}
    >
      <span>
        Seite {page} von {totalPages} ({total} Bewerbungen)
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Vorherige Seite"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Nächste Seite"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
