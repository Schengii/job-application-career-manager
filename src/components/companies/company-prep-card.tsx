"use client";

// -----------------------------------------------------------------------------
// Company Prep & Culture Insights Card
// -----------------------------------------------------------------------------
import { useState, useEffect } from "react";
import {
  CheckSquare,
  Building,
  Star,
  Sparkles,
  Search,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_COMPANY_PREP_CHECKLIST,
  CompanyPrepItem,
  calculatePrepProgress,
} from "@/lib/companies/companyPrep";

export function CompanyPrepCard({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName: string;
}) {
  const storageKey = `company_prep_${companyId}`;

  const [items, setItems] = useState<CompanyPrepItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_COMPANY_PREP_CHECKLIST;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : DEFAULT_COMPANY_PREP_CHECKLIST;
    } catch {
      return DEFAULT_COMPANY_PREP_CHECKLIST;
    }
  });

  const [kununuScore, setKununuScore] = useState<string>(() => {
    if (typeof window === "undefined") return "4.2";
    return localStorage.getItem(`${storageKey}_kununu`) || "4.2";
  });

  const [cultureNotes, setCultureNotes] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`${storageKey}_notes`) || "";
  });

  function toggleItem(id: string) {
    const updated = items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i));
    setItems(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  function handleScoreChange(val: string) {
    setKununuScore(val);
    try {
      localStorage.setItem(`${storageKey}_kununu`, val);
    } catch {
      // Ignore
    }
  }

  function handleNotesChange(val: string) {
    setCultureNotes(val);
    try {
      localStorage.setItem(`${storageKey}_notes`, val);
    } catch {
      // Ignore
    }
  }

  const { completed, total, progressPct } = calculatePrepProgress(items);
  const kununuSearchUrl = `https://www.kununu.com/de/search?q=${encodeURIComponent(companyName)}`;
  const googleNewsUrl = `https://www.google.com/search?q=${encodeURIComponent(companyName + " News")}&tbm=nws`;

  return (
    <Card className="border-border/80 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckSquare className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Unternehmens-Vorbereitung & Kultur-Check</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Recherche-Checkliste & Kununu-Notizen für das Vorstellungsgespräch
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
          {progressPct}% Vorbereitet ({completed}/{total})
        </div>
      </CardHeader>

      <CardContent className="pt-2 space-y-4 text-xs">
        {/* Fortschrittsbalken */}
        <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden border border-border">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Schnellsuch-Links */}
        <div className="flex flex-wrap gap-2">
          <a
            href={kununuSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 font-medium text-foreground hover:bg-surface-hover transition-colors text-[11px]"
          >
            <Star className="h-3 w-3 text-amber-500 fill-current" /> Kununu Bewertungen <ExternalLink className="h-3 w-3 ml-0.5 text-muted-foreground" />
          </a>
          <a
            href={googleNewsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 font-medium text-foreground hover:bg-surface-hover transition-colors text-[11px]"
          >
            <Search className="h-3 w-3 text-sky-500" /> Firmen-News durchsuchen <ExternalLink className="h-3 w-3 ml-0.5 text-muted-foreground" />
          </a>
        </div>

        {/* Checkliste */}
        <div className="space-y-2 rounded-xl border border-border bg-surface-hover/30 p-3.5">
          <span className="font-bold text-foreground text-[11px] uppercase tracking-wider block">
            Gesprächsvorbereitungs-Schritte
          </span>
          <div className="space-y-2">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2.5 cursor-pointer hover:bg-surface-hover/60 p-1.5 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={() => toggleItem(item.id)}
                  className="mt-0.5 rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                  {item.hint && <p className="text-[10px] text-muted-foreground mt-0.5">{item.hint}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Kununu Score & Kultur-Notizen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Kununu Score (1.0 - 5.0)
            </label>
            <input
              type="text"
              value={kununuScore}
              onChange={(e) => handleScoreChange(e.target.value)}
              placeholder="z.B. 4.3"
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
              Eindrücke zur Unternehmenskultur & Arbeitsatmosphäre
            </label>
            <input
              type="text"
              value={cultureNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="z.B. Starkes Feedback zu Teamwork, moderne Hardware, flexible Kernzeit"
              className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
