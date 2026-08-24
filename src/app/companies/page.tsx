"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, Building2, Briefcase } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { CompanyWithCounts } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CompanyStatusBadge } from "@/components/status-badge";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";

export default function CompaniesPage() {
  const { data: companies, isLoading } = useSWR<CompanyWithCounts[]>("/api/companies", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Unternehmen</h1>
          <p className="mt-1 text-sm text-muted-foreground">Alle Firmen, bei denen du dich beworben hast oder bewerben möchtest.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Neues Unternehmen
        </Button>
      </header>

      {isLoading && <p className="text-sm text-muted-foreground">Lade Unternehmen …</p>}
      {!isLoading && (companies?.length ?? 0) === 0 && (
        <p className="text-sm text-muted-foreground">Noch keine Unternehmen angelegt.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {companies?.map((company) => (
          <Link key={company.id} href={`/companies/${company.id}`}>
            <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:bg-surface-hover">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Building2 className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.city ?? "Ort unbekannt"}</p>
                  </div>
                </div>
                <CompanyStatusBadge status={company.status} />
              </div>
              <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" />
                {company._count.applications} Bewerbung(en) · {company._count.jobPostings} Stellenangebot(e)
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <CompanyFormDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
