"use client";

import { useState } from "react";
import { Award, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import {
  evaluateCertificationStatus,
  type CertificationItem,
} from "@/lib/documents/certificationTracker";

export function CertificationTrackerCard() {
  const toast = useToast();
  const [certs, setCerts] = useState<CertificationItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("USER_CERTIFICATIONS");
      if (saved) {
        try {
          return JSON.parse(saved).map((c: CertificationItem) => evaluateCertificationStatus(c));
        } catch {
          // fallback
        }
      }
    }
    return [
      evaluateCertificationStatus({
        id: "cert-1",
        name: "Fachinformatiker Anwendungsentwicklung (IHK)",
        issuer: "IHK Köln",
        issueDate: "2024-06-30",
        expiryDate: null,
      }),
      evaluateCertificationStatus({
        id: "cert-2",
        name: "AWS Certified Developer – Associate",
        issuer: "Amazon Web Services",
        issueDate: "2023-08-01",
        expiryDate: "2026-08-01",
      }),
    ];
  });

  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  function saveCerts(updated: CertificationItem[]) {
    setCerts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("USER_CERTIFICATIONS", JSON.stringify(updated));
    }
  }

  function handleAdd() {
    if (!name || !issuer) {
      toast.error("Bitte Zertifikatsname und Aussteller angeben.");
      return;
    }

    const created = evaluateCertificationStatus({
      id: `cert-${Date.now()}`,
      name,
      issuer,
      issueDate: issueDate || new Date().toISOString().slice(0, 10),
      expiryDate: expiryDate || null,
    });

    const next = [...certs, created];
    saveCerts(next);
    toast.success("Zertifikat erfolgreich hinterlegt!");
    setName("");
    setIssuer("");
    setIssueDate("");
    setExpiryDate("");
  }

  function handleDelete(id: string) {
    const next = certs.filter((c) => c.id !== id);
    saveCerts(next);
    toast.success("Zertifikat entfernt.");
  }

  const expiringCount = certs.filter((c) => c.status === "EXPIRING_SOON").length;

  return (
    <Card className="border border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-500" />
              IT-Zertifikate & Ablauf-Erinnerungen
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Verwalte deine IHK-Abschlüsse und Hersteller-Zertifikate (AWS, Scrum.org, Azure) mit automatischer 90-Tage Erneuerungs-Erinnerung.
            </p>
          </div>
          {expiringCount > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <AlertTriangle className="h-3.5 w-3.5" />
              {expiringCount} läuft bald ab
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Form */}
        <div className="rounded-lg border border-border/60 bg-surface-hover/20 p-3.5 space-y-3">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-primary" /> Neues Zertifikat / Nachweis erfassen
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <Input
              placeholder="Zertifikatsname (z.B. AWS Developer)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-8"
            />
            <Input
              placeholder="Aussteller (z.B. AWS, IHK, Scrum.org)"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="text-xs h-8"
            />
            <div>
              <span className="text-[10px] text-muted-foreground block mb-0.5">Erworben am:</span>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block mb-0.5">Gültig bis (optional):</span>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={handleAdd} className="h-7 text-xs">
              Hinzufügen
            </Button>
          </div>
        </div>

        {/* Certificate List */}
        <div className="space-y-2">
          {certs.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-surface hover:bg-surface-hover/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-muted/60">
                    {c.issuer}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>Erworben: {c.issueDate}</span>
                  {c.expiryDate ? (
                    <span
                      className={
                        c.status === "EXPIRING_SOON"
                          ? "text-amber-600 font-semibold"
                          : c.status === "EXPIRED"
                          ? "text-rose-600 font-semibold"
                          : ""
                      }
                    >
                      Ablauf: {c.expiryDate}{" "}
                      {c.daysUntilExpiry !== null && c.daysUntilExpiry !== undefined
                        ? `(in ${c.daysUntilExpiry} Tagen)`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      Lebenslang gültig
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded"
                title="Entfernen"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
