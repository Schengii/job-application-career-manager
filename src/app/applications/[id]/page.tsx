"use client";

import { use, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { fetcher, apiDelete } from "@/lib/api";
import type { ApplicationDetail } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { ApplicationDetailsForm } from "@/components/applications/application-details-form";
import { CompanyInfoCard } from "@/components/applications/company-info-card";
import { StatusTimeline } from "@/components/applications/status-timeline";
import { DocumentsPanel } from "@/components/applications/documents-panel";
import { CoverLetterPanel } from "@/components/applications/cover-letter-panel";
import { VoiceMemoPanel } from "@/components/applications/voice-memo-panel";

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [deleting, setDeleting] = useState(false);

  const { data: application, isLoading, error } = useSWR<ApplicationDetail>(
    `/api/applications/${id}`,
    fetcher,
  );

  async function handleDelete() {
    if (!confirm("Diese Bewerbung inkl. Verlauf und Anschreiben wirklich unwiderruflich löschen?")) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/applications/${id}`);
      await Promise.all([mutate("/api/applications"), mutate("/api/metrics")]);
      toast.success("Bewerbung wurde gelöscht.");
      router.push("/applications");
    } catch {
      toast.error("Löschen fehlgeschlagen.");
      setDeleting(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Lade Bewerbung …</p>;
  if (error || !application) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-danger">Bewerbung konnte nicht gefunden werden.</p>
        <Link href="/applications" className="text-sm text-primary hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  const refresh = () => mutate(`/api/applications/${id}`);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/applications" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zurück zu allen Bewerbungen
        </Link>
        <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-3.5 w-3.5" /> Bewerbung löschen
        </Button>
      </div>

      <header>
        <h1 className="text-2xl font-semibold text-foreground">{application.position}</h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          bei {application.company.name}
          {application.jobPosting?.sourceUrl && (
            <a
              href={application.jobPosting.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Stellenanzeige ansehen <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Bewerbungsdetails</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ApplicationDetailsForm application={application} onSaved={refresh} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anschreiben-Generator</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <CoverLetterPanel application={application} onChange={refresh} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unterlagen</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <DocumentsPanel application={application} onChange={refresh} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <CompanyInfoCard company={application.company} onSaved={refresh} />

          <VoiceMemoPanel applicationId={application.id} companyName={application.company.name} />

          <Card>
            <CardHeader>
              <CardTitle>Verlauf</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusTimeline events={application.statusEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
