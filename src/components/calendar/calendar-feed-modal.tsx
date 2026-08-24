"use client";

// -----------------------------------------------------------------------------
// Kalender-Abo & Feed Modal (Live-Sync mit Handy, Google & Outlook)
// -----------------------------------------------------------------------------
import { useState } from "react";
import { Calendar, Copy, Check, ExternalLink, X, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function CalendarFeedModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [feedUrl] = useState(() =>
    typeof window !== "undefined" ? `${window.location.origin}/api/calendar/feed.ics` : ""
  );

  if (!open) return null;

  function handleCopy() {
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    toast.success("Kalender-Abo-URL in die Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Live-Kalender-Abonnement</h2>
              <p className="text-xs text-muted-foreground">
                Termine & Gespräche automatisch synchronisieren
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

        {/* Content */}
        <div className="scroll-thin flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3.5 text-xs text-sky-700 dark:text-sky-300 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Automatische Aktualisierung:</span>
              <p className="mt-0.5 text-[11px] text-sky-700/80 dark:text-sky-300/80">
                Wenn du ein neues Vorstellungsgespräch oder eine Frist einträgst, wird dein Smartphone-/Desktop-Kalender automatisch synchronisiert.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Abonnierbare Feed-URL (.ics):</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={feedUrl}
                className="flex-1 rounded-lg border border-border bg-surface-hover/50 px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
              />
              <Button size="sm" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4" />}
                <span>{copied ? "Kopiert" : "Kopieren"}</span>
              </Button>
            </div>
          </div>

          {/* Anleitungen */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-primary" /> So bindest du den Kalender ein:
            </h3>

            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="rounded-lg border border-border bg-surface p-2.5">
                <p className="font-semibold text-foreground">🍏 Apple Kalender (iPhone / iPad / Mac):</p>
                <p className="mt-0.5 text-[11px]">
                  Klicke auf <a href={webcalUrl} className="text-primary font-semibold underline">1-Klick Abonnieren</a> oder gehe in iOS auf <em>Einstellungen → Kalender → Accounts → Kalenderabo hinzufügen</em>.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-2.5">
                <p className="font-semibold text-foreground">📅 Google Kalender:</p>
                <p className="mt-0.5 text-[11px]">
                  Öffne Google Kalender im Web → <em>Weitere Kalender (+) → Per URL hinzufügen</em> → Kopierte URL einfügen.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-2.5">
                <p className="font-semibold text-foreground">💼 Microsoft Outlook:</p>
                <p className="mt-0.5 text-[11px]">
                  Gehe in Outlook auf <em>Kalender hinzufügen → Aus dem Web abonnieren</em> → URL einfügen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-surface-hover/30">
          <Button variant="outline" size="sm" onClick={onClose}>
            Schließen
          </Button>
          <a href={webcalUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="card-hover-effect">
              <ExternalLink className="h-4 w-4" />
              <span>Direkt im Kalender öffnen</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
