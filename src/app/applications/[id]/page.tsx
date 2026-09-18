"use client";

import { use, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Printer,
  Video,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { fetcher, apiDelete } from "@/lib/core/api";
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
import { InterviewNotesEditor } from "@/components/applications/interview-notes-editor";
import { InterviewDossierModal } from "@/components/applications/interview-dossier-modal";
import { InterviewDaySheetModal } from "@/components/interview/interview-day-sheet-modal";
import { buildInterviewDayData } from "@/lib/interview/interviewDaySheet";
import { FollowUpSnoozeButtons } from "@/components/applications/follow-up-snooze-buttons";
import { ApplicationStatusBadge } from "@/components/status-badge";
import { parseTags, getTagStyle } from "@/lib/core/tags";
import { apiPut } from "@/lib/core/api";
import { Smartphone } from "lucide-react";

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [deleting, setDeleting] = useState(false);
  const [dossierOpen, setDossierOpen] = useState(false);
  const [daySheetOpen, setDaySheetOpen] = useState(false);

  const { data: application, isLoading, error } = useSWR<ApplicationDetail>(
    `/api/applications/${id}`,
    fetcher
  );

  async function handleDelete() {
    if (!confirm("Diese Bewerbung inkl. Verlauf und Anschreiben wirklich unwiderruflich löschen?")) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/applications/${id}`);
      await Promise.all([
        mutate("/api/applications"),
        mutate("/api/metrics"),
        mutate("/api/analytics"),
      ]);
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
  const tagsList = parseTags(application.tags);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/applications" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Zurück zu allen Bewerbungen
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDaySheetOpen(true)}
            className="card-hover-effect border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
            title="Kompakte Ansicht für den Tag des Gesprächs (Navigation, Tel, Notizen)"
          >
            <Smartphone className="h-4 w-4" /> Quick-Sheet (Unterwegs)
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDossierOpen(true)}
            className="card-hover-effect border-primary/30 text-primary hover:bg-primary-soft"
          >
            <Printer className="h-4 w-4" /> Dossier drucken / PDF
          </Button>

          <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="h-3.5 w-3.5" /> Löschen
          </Button>
        </div>
      </div>

      <header className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{application.position}</h1>
            <ApplicationStatusBadge status={application.status} />
            {application.meetingUrl && (
              <a
                href={application.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white transition-colors"
                title="Online-Meeting öffnen"
              >
                <Video className="h-3.5 w-3.5" />
                <span>Meeting beitreten</span>
              </a>
            )}
          </div>

          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>bei</span>
            <Link
              href={`/companies/${application.company.id}`}
              className="font-medium text-foreground hover:underline"
            >
              {application.company.name}
            </Link>
            {application.jobPosting?.sourceUrl && (
              <a
                href={application.jobPosting.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline ml-2"
              >
                Stellenanzeige <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </p>

          {tagsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tagsList.map((t) => (
                <span
                  key={t}
                  className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${getTagStyle(t)}`}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border/60">
            <FollowUpSnoozeButtons
              applicationId={application.id}
              currentNextStepDate={application.nextStepDate}
              onSnoozed={refresh}
            />
          </div>
        </div>
      </header>

      {/* Absage-Banner */}
      {application.status === "REJECTED" && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold">Bewerbung wurde abgelehnt</h4>
            <p className="text-xs mt-0.5">
              Dokumentierter Absagegrund:{" "}
              <strong>{application.rejectionReason || "Kein konkreter Grund hinterlegt"}</strong>
            </p>
          </div>
        </div>
      )}

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

          <InterviewNotesEditor
            applicationId={application.id}
            companyName={application.company.name}
            initialNotes={application.notes}
            onSaveNotes={async (updatedNotes) => {
              await apiPut(`/api/applications/${application.id}`, { notes: updatedNotes });
              refresh();
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Anschreiben-Generator & KI-Optimierung</CardTitle>
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
              <CardTitle>Verlauf & Chronologie</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <StatusTimeline
                applicationId={application.id}
                events={application.statusEvents}
                interactions={application.interactions}
                onChanged={refresh}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <InterviewDossierModal
        open={dossierOpen}
        onClose={() => setDossierOpen(false)}
        application={application}
      />

      <InterviewDaySheetModal
        open={daySheetOpen}
        onClose={() => setDaySheetOpen(false)}
        data={buildInterviewDayData(application)}
      />
    </div>
  );
}
