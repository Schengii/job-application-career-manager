"use client";

// -----------------------------------------------------------------------------
// E-Mail-Antworten-Inbox — zentrale Übersicht ALLER offenen, vom Auto-Sync
// (src/lib/emailImapSync.ts) erkannten Status-Vorschläge über alle
// Bewerbungen hinweg. Bisher waren solche Vorschläge nur über den
// EmailResponseModal einzeln je Bewerbung einsehbar; hier lassen sie sich an
// einer Stelle mit einem Klick annehmen oder ablehnen.
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { Mail, Sparkles, Check, X, Calendar, Building2, RefreshCw, Inbox as InboxIcon, History } from "lucide-react";
import { fetcher, apiPost } from "@/lib/core/api";
import { useToast } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/core/utils";
import { APPLICATION_STATUSES } from "@/lib/core/constants";
import type { EmailSuggestionWithApplication } from "@/types";

const PENDING_URL = "/api/email-sync/pending";
const HISTORY_URL = "/api/email-sync/history";

function statusBadgeColor(status: string | null) {
  return APPLICATION_STATUSES.find((s) => s.value === status)?.color ?? "slate";
}

function statusLabel(status: string | null) {
  return APPLICATION_STATUSES.find((s) => s.value === status)?.label ?? status ?? "—";
}

export default function InboxPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const { data: suggestions, isLoading } = useSWR<EmailSuggestionWithApplication[]>(PENDING_URL, fetcher);
  const { data: history, isLoading: historyLoading } = useSWR<EmailSuggestionWithApplication[]>(
    HISTORY_URL,
    fetcher
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function resolve(id: string, action: "ACCEPT" | "REJECT") {
    setBusyId(id);
    try {
      await apiPost(PENDING_URL, { suggestionId: id, action });
      toast.success(action === "ACCEPT" ? "Status übernommen." : "Vorschlag abgelehnt.");
      mutate(PENDING_URL);
      mutate(HISTORY_URL);
    } catch {
      toast.error("Fehler beim Bearbeiten des Vorschlags.");
    } finally {
      setBusyId(null);
    }
  }

  async function runSync() {
    setSyncing(true);
    try {
      await apiPost("/api/email-sync", { simulate: true });
      toast.success("E-Mail-Sync abgeschlossen.");
      mutate(PENDING_URL);
    } catch {
      toast.error("Fehler beim E-Mail-Sync.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <InboxIcon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold text-foreground">E-Mail-Antworten-Inbox</h1>
            <p className="text-sm text-muted-foreground">
              Alle offenen, per E-Mail-Sync erkannten Status-Vorschläge an einer Stelle annehmen oder ablehnen.
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={runSync} disabled={syncing}>
          <RefreshCw className={syncing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Sync starten
        </Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <InboxIcon className="h-4 w-4" />
          Offen{suggestions && suggestions.length > 0 ? ` (${suggestions.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            tab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="h-4 w-4" />
          Verlauf
        </button>
      </div>

      {tab === "pending" && (
        <>
          {isLoading && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">Lade Vorschläge …</CardContent>
            </Card>
          )}

          {!isLoading && suggestions && suggestions.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <Mail className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Keine offenen Vorschläge</p>
                <p className="text-xs text-muted-foreground">
                  Starte einen E-Mail-Sync, um neue Rückmeldungen zu prüfen.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {suggestions?.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle className="flex items-center gap-1.5 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <Link href={`/applications/${s.applicationId}`} className="hover:underline">
                    {s.application.company.name} – {s.application.position}
                  </Link>
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  Von {s.emailFrom} · {s.emailSubject}
                </span>
              </div>
              <Badge color={statusBadgeColor(s.suggestedStatus)}>{s.confidence}% Sicherheit</Badge>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> {s.statusLabel}
                </span>
                {s.suggestedStatus && (
                  <>
                    <span className="text-muted-foreground">→ vorgeschlagener Status:</span>
                    <Badge color={statusBadgeColor(s.suggestedStatus)}>{statusLabel(s.suggestedStatus)}</Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{s.reasoning}</p>
              {(s.extractedDate || s.extractedTime) && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Calendar className="h-3.5 w-3.5" />
                  Erkannter Termin: {s.extractedDate} {s.extractedTime}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => resolve(s.id, "REJECT")}
                  disabled={busyId === s.id}
                >
                  <X className="h-4 w-4" /> Ablehnen
                </Button>
                <Button size="sm" onClick={() => resolve(s.id, "ACCEPT")} disabled={busyId === s.id}>
                  <Check className="h-4 w-4" /> Übernehmen
                </Button>
              </div>
            </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === "history" && (
        <>
          {historyLoading && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">Lade Verlauf …</CardContent>
            </Card>
          )}

          {!historyLoading && history && history.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <History className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Noch kein Verlauf</p>
                <p className="text-xs text-muted-foreground">
                  Angenommene oder abgelehnte Vorschläge erscheinen hier.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {history?.map((s) => (
              <Card key={s.id}>
                <CardHeader>
                  <div className="flex flex-col gap-0.5">
                    <CardTitle className="flex items-center gap-1.5 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <Link href={`/applications/${s.applicationId}`} className="hover:underline">
                        {s.application.company.name} – {s.application.position}
                      </Link>
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      Von {s.emailFrom} · {s.emailSubject}
                    </span>
                  </div>
                  <Badge color={s.status === "ACCEPTED" ? "green" : "slate"}>
                    {s.status === "ACCEPTED" ? "Übernommen" : "Abgelehnt"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <Sparkles className="h-3.5 w-3.5" /> {s.statusLabel}
                    </span>
                    {s.suggestedStatus && (
                      <>
                        <span className="text-muted-foreground">→ vorgeschlagener Status:</span>
                        <Badge color={statusBadgeColor(s.suggestedStatus)}>{statusLabel(s.suggestedStatus)}</Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.reasoning}</p>
                  {s.resolvedAt && (
                    <p className="text-xs text-muted-foreground">
                      Bearbeitet am {new Date(s.resolvedAt).toLocaleString("de-DE")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
