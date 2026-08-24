"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Building2, Briefcase, Search, X, MapPin } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { CompanyWithCounts } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { CompanyStatusBadge } from "@/components/status-badge";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { COMPANY_STATUSES } from "@/lib/constants";

type SortOption = "NAME_ASC" | "APPS_DESC" | "UPDATED_DESC";

export default function CompaniesPage() {
  const { data: companies, isLoading } = useSWR<CompanyWithCounts[]>("/api/companies", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NAME_ASC");

  const filtered = useMemo(() => {
    if (!companies) return [];
    let list = [...companies];

    // Status Filter
    if (statusFilter !== "ALL") {
      list = list.filter((c) => c.status === statusFilter);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.contactName && c.contactName.toLowerCase().includes(q)) ||
          (c.contactEmail && c.contactEmail.toLowerCase().includes(q))
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "NAME_ASC") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "APPS_DESC") {
        return b._count.applications - a._count.applications;
      }
      if (sortBy === "UPDATED_DESC") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return 0;
    });

    return list;
  }, [companies, statusFilter, searchQuery, sortBy]);

  const hasActiveFilters = statusFilter !== "ALL" || searchQuery.trim() !== "";

  function resetFilters() {
    setStatusFilter("ALL");
    setSearchQuery("");
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Unternehmen</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Firmen, bei denen du dich beworben hast oder bewerben möchtest.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="card-hover-effect">
          <Plus className="h-4 w-4" /> Neues Unternehmen
        </Button>
      </header>

      {/* Filter- & Suchleiste */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 glass-card">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[280px]">
          <div className="relative min-w-[200px] max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Unternehmen, Ort, Kontakt suchen …"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 w-auto text-xs"
          >
            <option value="ALL">Alle Status ({companies?.length ?? 0})</option>
            {COMPANY_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} ({companies?.filter((c) => c.status === s.value).length ?? 0})
              </option>
            ))}
          </Select>

          {/* Sortierung */}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-9 w-auto text-xs"
          >
            <option value="NAME_ASC">Name (A–Z)</option>
            <option value="APPS_DESC">Meiste Bewerbungen</option>
            <option value="UPDATED_DESC">Zuletzt aktualisiert</option>
          </Select>

          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters} className="h-9 text-xs text-muted-foreground hover:text-danger">
              <X className="h-3.5 w-3.5" /> Filter zurücksetzen
            </Button>
          )}
        </div>

        <span className="text-xs text-muted-foreground">
          {filtered.length} von {companies?.length ?? 0} Firmen
        </span>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Unternehmen …</p>}
      {!isLoading && filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-sm text-muted-foreground">
          Keine Unternehmen für diesen Filter gefunden.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((company) => (
          <Link key={company.id} href={`/companies/${company.id}`} className="group">
            <Card className="flex h-full flex-col gap-3 p-5 card-hover-effect">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-110">
                    <Building2 className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {company.name}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {company.city ?? "Ort unbekannt"}
                    </p>
                  </div>
                </div>
                <CompanyStatusBadge status={company.status} />
              </div>
              <div className="mt-auto flex items-center gap-1.5 pt-2 text-xs text-muted-foreground border-t border-border/50">
                <Briefcase className="h-3.5 w-3.5" />
                <span>
                  {company._count.applications} Bewerbung(en) · {company._count.jobPostings} Stellenangebot(e)
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <CompanyFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
