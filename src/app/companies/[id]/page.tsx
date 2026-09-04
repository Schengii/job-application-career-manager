"use client";

import { use, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, ArrowUpRight } from "lucide-react";
import { fetcher, apiDelete } from "@/lib/core/api";
import type { CompanyDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { CompanyInfoCard } from "@/components/applications/company-info-card";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/core/utils";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [deleting, setDeleting] = useState(false);

  const { data: company, isLoading, error } = useSWR<CompanyDetail>(`/api/companies/${id}`, fetcher);

  async function handleDelete() {
    if (!confirm("Unternehmen inkl. aller verknüpften Bewerbungen wirklich löschen?")) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/companies/${id}`);
      await Promise.all([mutate("/api/companies"), mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success("Unternehmen wurde gelöscht.");
      router.push("/companies");
    } catch {
      toast.error("Löschen fehlgeschlagen (evtl. noch verknüpfte Daten).");
      setDeleting(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Lade Unternehmen …</p>;
  if (error || !company) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-danger">Unternehmen konnte nicht gefunden werden.</p>
        <Link href="/companies" className="text-sm text-primary hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/companies" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zurück zu allen Unternehmen
        </Link>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-3.5 w-3.5" /> Unternehmen löschen
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CompanyInfoCard company={company} onSaved={() => mutate(`/api/companies/${id}`)} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bewerbungen bei diesem Unternehmen</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {company.applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Bewerbungen bei diesem Unternehmen.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {company.applications.map((app) => (
                    <li key={app.id}>
                      <Link
                        href={`/applications/${app.id}`}
                        className="flex items-center justify-between gap-3 py-3 hover:opacity-80"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{app.position}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(app.applicationDate)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ApplicationStatusBadge status={app.status} />
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gespeicherte Stellenangebote</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {company.jobPostings.length === 0 ? (
                <p className="text-sm text-muted-foreground">Keine Stellenangebote diesem Unternehmen zugeordnet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {company.jobPostings.map((job) => (
                    <li key={job.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.location ?? "Ort unbekannt"} {job.remote && "· Remote"}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
