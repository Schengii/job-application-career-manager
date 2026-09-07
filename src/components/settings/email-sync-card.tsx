"use client";

// -----------------------------------------------------------------------------
// E-Mail IMAP Auto-Sync Settings Card Component
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Mail, RefreshCw, CheckCircle2, ShieldCheck, Loader2, Key, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { fetcher, apiPost, apiPatch } from "@/lib/core/api";
import type { EmailSyncRunResult } from "@/lib/email/emailImapSync";

type EmailSyncSettings = {
  imapEnabled: boolean;
  imapHost: string | null;
  imapPort: number | null;
  imapUser: string | null;
  imapFolder: string;
  hasImapPassword: boolean;
  imapPasswordPreview: string | null;
};

export function EmailSyncCard() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: settings, isLoading } = useSWR<EmailSyncSettings>("/api/email-sync", fetcher);

  const [host, setHost] = useState("");
  const [port, setPort] = useState(993);
  const [user, setUser] = useState("");
  const [folder, setFolder] = useState("INBOX");
  const [enabled, setEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Sicherheit: `imapPassword` kommt vom Server immer als `hasImapPassword`/
  // `imapPasswordPreview` (nie im Klartext, siehe GET /api/email-sync und
  // toPublicPreferences() in src/lib/preferences.ts) — exakt dasselbe Muster
  // wie der KI-API-Key in preferences-form.tsx. Das Eingabefeld ist daher
  // immer leer und wird nur beim Speichern mitgeschickt, wenn tatsächlich ein
  // neues Passwort eingetippt wurde.
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordPreview, setPasswordPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [newSmtpPassword, setNewSmtpPassword] = useState("");

  if (settings && !initialized) {
    setHost(settings.imapHost || "imap.strato.de");
    setPort(settings.imapPort || 993);
    setUser(settings.imapUser || "bewerbung@alexander-schepp.de");
    setFolder(settings.imapFolder || "INBOX");
    setEnabled(settings.imapEnabled || false);
    setHasPassword(settings.hasImapPassword);
    setPasswordPreview(settings.imapPasswordPreview);
    setInitialized(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        imapHost: host,
        imapPort: Number(port),
        imapUser: user,
        imapFolder: folder,
        imapEnabled: enabled,
      };
      // `imapPassword` nur mitschicken, wenn tatsächlich ein neues Passwort
      // eingetippt wurde — sonst bleibt das bisherige unangetastet (siehe
      // PATCH-Handler in /api/preferences).
      if (newPassword.trim()) {
        payload.imapPassword = newPassword.trim();
      }
      if (smtpHost.trim()) payload.smtpHost = smtpHost.trim();
      if (smtpPort) payload.smtpPort = Number(smtpPort);
      if (smtpUser.trim()) payload.smtpUser = smtpUser.trim();
      if (smtpFrom.trim()) payload.smtpFrom = smtpFrom.trim();
      if (newSmtpPassword.trim()) payload.smtpPassword = newSmtpPassword.trim();

      await apiPatch("/api/preferences", payload);
      const updated = await mutate("/api/email-sync");
      if (updated) {
        setHasPassword(updated.hasImapPassword);
        setPasswordPreview(updated.imapPasswordPreview);
      }
      setNewPassword("");
      setNewSmtpPassword("");
      toast.success("E-Mail & SMTP Einstellungen gespeichert!");
    } catch {
      toast.error("Fehler beim Speichern der Einstellungen.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemovePassword() {
    if (!confirm("IMAP-Passwort wirklich entfernen? Der Auto-Sync arbeitet danach wieder mit simulierten Beispiel-E-Mails.")) {
      return;
    }
    setSaving(true);
    try {
      const updated = await apiPatch<{ hasImapPassword: boolean; imapPasswordPreview: string | null }>(
        "/api/preferences",
        { imapPassword: "" }
      );
      setHasPassword(updated.hasImapPassword);
      setPasswordPreview(updated.imapPasswordPreview);
      setNewPassword("");
      await mutate("/api/email-sync");
      toast.success("IMAP-Passwort wurde entfernt.");
    } catch {
      toast.error("Entfernen fehlgeschlagen.");
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
        usedRealImap: boolean;
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

  async function handleLiveSync() {
    setTesting(true);
    try {
      const res = await apiPost<{
        success: boolean;
        result: EmailSyncRunResult;
        usedRealImap: boolean;
      }>("/api/email-sync", {});

      if (res.usedRealImap) {
        toast.success(
          `Echtes Postfach abgerufen! ${res.result.totalEmailsScanned} Mails gescannt, ${res.result.matchedActions.length} Treffer erkannt.`
        );
      } else {
        toast.info(
          "Keine vollständige IMAP-Konfiguration hinterlegt (oder Verbindung fehlgeschlagen) — es wurden stattdessen Beispiel-E-Mails verwendet."
        );
      }
    } catch {
      toast.error("Fehler beim Abrufen des Postfachs.");
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
              <div className="sm:col-span-2">
                <label className="mb-1 block font-medium text-foreground" htmlFor="imap-password">
                  IMAP Passwort
                </label>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    id="imap-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={
                      hasPassword
                        ? `Hinterlegt (${passwordPreview}) — zum Ändern neues Passwort eingeben`
                        : "App-Passwort (bei Gmail/Outlook: kein normales Konto-Passwort)"
                    }
                    autoComplete="off"
                  />
                  {hasPassword && (
                    <button
                      type="button"
                      onClick={handleRemovePassword}
                      disabled={saving}
                      title="Passwort entfernen"
                      className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-danger-soft hover:text-danger"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SMTP Konfiguration für Bewerbungs-Direktversand */}
            <div className="border-t border-border/80 pt-4 mt-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block">
                SMTP Postausgang (Bewerbungen direkt versenden)
              </span>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <label className="mb-1 block font-medium text-foreground">SMTP Host</label>
                  <Input
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="z.B. smtp.strato.de oder smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-foreground">SMTP Port</label>
                  <Input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    placeholder="587 oder 465"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-foreground">SMTP Benutzer / E-Mail</label>
                  <Input
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="bewerbung@alexander-schepp.de"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-foreground">Absendername & E-Mail</label>
                  <Input
                    value={smtpFrom}
                    onChange={(e) => setSmtpFrom(e.target.value)}
                    placeholder="Max Mustermann <max@mustermann.de>"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-medium text-foreground">SMTP Passwort</label>
                  <Input
                    type="password"
                    value={newSmtpPassword}
                    onChange={(e) => setNewSmtpPassword(e.target.value)}
                    placeholder="Neues SMTP-Passwort eingeben (wird AES-256 verschlüsselt)"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-surface-hover/40 p-3 text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Lokale Sicherheit & Datenschutz
              </span>
              <p>
                Der E-Mail-Abruf erfolgt direkt von diesem Server per IMAP/TLS — kein Umweg über einen Drittanbieter.
                Das Passwort wird verschlüsselt gespeichert (AES-256-GCM) und nie im Klartext an den Browser zurückgegeben.
                Ohne hinterlegte Zugangsdaten (oder bei einem Verbindungsfehler) arbeitet die App transparent mit
                simulierten Beispiel-E-Mails weiter.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleTestSync} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
                  Demo-Sync testen
                </Button>
                <Button size="sm" variant="outline" onClick={handleLiveSync} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Mail className="h-4 w-4 mr-1.5" />}
                  Postfach jetzt abrufen
                </Button>
              </div>
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
