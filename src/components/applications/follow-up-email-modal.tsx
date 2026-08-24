"use client";

// -----------------------------------------------------------------------------
// Nachfass-E-Mail Modal
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import { Mail, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { generateFollowUpEmail, CoverLetterCompany, CoverLetterProfile } from "@/lib/coverLetterGenerator";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import type { PreferencesWithProfile } from "@/types";

export function FollowUpEmailModal({
  open,
  onClose,
  company,
  position,
  applicationDate,
}: {
  open: boolean;
  onClose: () => void;
  company: CoverLetterCompany;
  position: string;
  applicationDate?: Date | string | null;
}) {
  const { data: preferences } = useSWR<PreferencesWithProfile>(open ? "/api/preferences" : null, fetcher);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-base font-semibold text-foreground">Nachfass-E-Mail Vorlage</h2>
              <p className="text-xs text-muted-foreground">
                Für {position} bei {company.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {preferences ? (
          <FollowUpEmailContent
            company={company}
            position={position}
            applicationDate={applicationDate}
            profile={preferences as unknown as CoverLetterProfile}
          />
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Lade Profildaten …
          </div>
        )}
      </div>
    </div>
  );
}

function FollowUpEmailContent({
  company,
  position,
  applicationDate,
  profile,
}: {
  company: CoverLetterCompany;
  position: string;
  applicationDate?: Date | string | null;
  profile: CoverLetterProfile;
}) {
  const toast = useToast();

  const generated = useMemo(
    () =>
      generateFollowUpEmail({
        company,
        position,
        applicationDate,
        profile,
      }),
    [company, position, applicationDate, profile],
  );

  const [subject, setSubject] = useState(generated.subject);
  const [body, setBody] = useState(generated.body);

  function handleCopyAll() {
    navigator.clipboard.writeText(`Betreff: ${subject}\n\n${body}`);
    toast.success("Nachfass-E-Mail (Betreff + Text) kopiert.");
  }

  function handleOpenMailClient() {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");
  }

  return (
    <>
      <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Betreff</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Nachricht</label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="mt-1 text-sm leading-relaxed"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4 bg-surface-hover/30">
        <Button variant="outline" size="sm" onClick={handleOpenMailClient}>
          <Mail className="h-4 w-4" /> Im E-Mail-Programm öffnen
        </Button>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleCopyAll}>
            <Copy className="h-4 w-4" /> Text kopieren
          </Button>
        </div>
      </div>
    </>
  );
}
