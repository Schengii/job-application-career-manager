"use client";

// -----------------------------------------------------------------------------
// E-Mail IMAP Auto-Sync Settings Card Component
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Mail, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { fetcher, apiPut, apiPost } from "@/lib/api";
import type { EmailSyncRunResult } from "@/lib/emailImapSync";

export function EmailSyncCard() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useSWR<{
    imapEnabled: boolean;
    imapHost: string | null;
    imapPort: number | null;
    imapUser: string | null;
    imapFolder: string;
  }>("/api/email-sync", fetcher);

  const [host, setHost] = useState("");
  const [port, setPort] = useState(993);
  const [user, setUser] = useState("");
  const [folder, setFolder] = useState("INBOX");
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setHost(settings.imapHost || "imap.strato.de");
    setPort(settings.imapPort || 993);
    setUser(settings.imapUser || "bewerbung@alexander-schepp.de");
    setFolder(settings.imapFolder || "INBOX");
    setEnabled(settings.imapEnabled || false);
    setInitialized(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiPut("/api/preferences", {
        imapHost: host,
        imapPort: Number(port),
        imapUser: user,
        imapFolder: folder,
        imapEnabled: enabled,
      });
      await mutate("/api/email-sync");
      toast.success("E-Mail Sync-Einstellungen gespeichert!");
    } catch {
      toast.error("Fehler beim Speichern der Einstellungen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestSync() {
    setTesting(true);
    try {
      const res = await apiPost<{
        success: boolean;
        result: EmailSyncRunResult;
      }>("/api/email-sync", { simulate: true });

      toast.success(
        `E-Mail Sync erfolgreich! ${res.result.totalEmailsScanned} Mails gescannt, ${res.result.matchedActions.length} Treffer erkannt.`
      );
    } catch {
      toast.error("Fehler beim Testlauf des E-Mail Syncs.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-5 w-5 text-sky-500" /> E-Mail Posteingang Auto-Sync (IMAP)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Synchronisiert automatisch Rückmeldungen, Einladungen und Termine von Arbeitgebern aus deinem Postfach.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-xs text-muted-foreground">Lade IMAP-Einstellungen …</p>}

        {!isLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="imap-enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary"
              />
              <label htmlFor="imap-enabled" className="text-sm font-semibold text-foreground cursor-pointer">
                E-Mail Auto-Sync aktivieren
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
              <div>
                <Input
                  label="IMAP Server Host"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="imap.strato.de / imap.gmail.com"
                />
              </div>
              <div>
                <Input
                  label="IMAP Port"
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder="993"
                />
              </div>
              <div>
                <Input
                  label="E-Mail / Benutzername"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="deine-mail@domain.de"
                />
              </div>
              <div>
                <Input
                  label="Ordnername"
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  placeholder="INBOX oder Bewerbungen"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-surface-hover/40 p-3 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Lokale Sicherheit & Datenschutz
              </span>
              <p>
                Der E-Mail-Abruf erfolgt rein lokal auf deinem Rechner. Keine E-Mail-Inhalte verlassen dein System.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button size="sm" variant="outline" onClick={handleTestSync} disabled={testing}>
                {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                Postfach jetzt abrufen
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Einstellungen speichern
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
