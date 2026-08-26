"use client";

// -----------------------------------------------------------------------------
// Portfolio Share Link Manager Component
// -----------------------------------------------------------------------------
import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Globe2, Copy, Check, RefreshCw, Trash2, Eye, ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fetcher, apiPost, apiDelete } from "@/lib/api";

export function PortfolioShareCard() {
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: status, isLoading } = useSWR<{
    token: string | null;
    active: boolean;
    viewCount: number;
    expiresAt: string | null;
  }>("/api/portfolio/token", fetcher);

  const shareUrl =
    typeof window !== "undefined" && status?.token
      ? `${window.location.origin}/portfolio/${status.token}`
      : "";

  async function handleGenerateToken() {
    setLoading(true);
    try {
      await apiPost("/api/portfolio/token", {});
      await mutate("/api/portfolio/token");
      toast.success("Neuer Portfolio-Link wurde generiert!");
    } catch {
      toast.error("Fehler beim Erzeugen des Links.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeToken() {
    if (!confirm("Diesen Portfolio-Link wirklich deaktivieren? Recruiter können ihn danach nicht mehr aufrufen.")) return;
    setLoading(true);
    try {
      await apiDelete("/api/portfolio/token");
      await mutate("/api/portfolio/token");
      toast.success("Portfolio-Link wurde deaktiviert.");
    } catch {
      toast.error("Fehler beim Deaktivieren.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Portfolio-Link in Zwischenablage kopiert!");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="border-border bg-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-indigo-500" /> Digitales Recruiter-Portfolio (&quot;One-Pager&quot;)
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Erzeuge einen geschützten, tokenisierten Link für Bewerbungen & Recruiter-Direktnachrichten.
          </p>
        </div>
        {status?.active && (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> {status.viewCount} Aufrufe
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p className="text-xs text-muted-foreground">Lade Portfolio-Status …</p>}

        {!isLoading && status?.token && status.active ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-border bg-surface-hover/60 px-3 py-2 text-xs font-mono text-foreground"
              />
              <Button size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 mr-1 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1" />}
                Kopieren
              </Button>
              <a href={shareUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-4 w-4 mr-1" /> Vorschau
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
              <span>
                Gültig bis: {status.expiresAt ? new Date(status.expiresAt).toLocaleDateString("de-DE") : "60 Tage"}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleGenerateToken} disabled={loading} className="h-7 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" /> Neu generieren
                </Button>
                <Button size="sm" variant="danger" onClick={handleRevokeToken} disabled={loading} className="h-7 text-xs">
                  <Trash2 className="h-3 w-3 mr-1" /> Deaktivieren
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
            <Globe2 className="h-8 w-8 text-muted-foreground/50 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">Noch kein aktiver Share-Link vorhanden</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Generiere einen Link, um deine Projekte, Referenzen und Tech-Skills professionell zu präsentieren.
              </p>
            </div>
            <Button onClick={handleGenerateToken} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldCheck className="h-4 w-4 mr-1.5" />}
              Portfolio-Link generieren
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
