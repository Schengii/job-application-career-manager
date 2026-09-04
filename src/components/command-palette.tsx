"use client";

// -----------------------------------------------------------------------------
// Globale Suche (⌘K / Strg+K): durchsucht Bewerbungen, Unternehmen und
// Stellenangebote gleichzeitig und springt per Klick/Enter direkt zum
// passenden Datensatz. Ein SaaS-Standard-Feature für schnelle Navigation in
// einer wachsenden Datenmenge.
// -----------------------------------------------------------------------------
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Briefcase,
  Building2,
  Search as SearchIcon,
  FileSearch,
  PlusCircle,
  Zap,
  Mic,
  FileText,
  TrendingUp,
  Mail,
  Share2,
  Code2,
  HandCoins,
  GraduationCap,
  Globe2,
  Network,
  Inbox,
  Calendar,
} from "lucide-react";
import { fetcher } from "@/lib/core/api";
import type { ApplicationListItem, CompanyWithCounts, JobPostingWithCompany } from "@/types";

type ResultItem = {
  id: string;
  group: "Aktionen" | "Bewerbungen" | "Unternehmen" | "Jobsuche";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Nutzt denselben SWR-Cache wie die jeweiligen Seiten – kein Zusatz-Request,
  // solange die Seiten schon einmal besucht wurden; sonst wird einmalig geladen.
  const { data: applications } = useSWR<ApplicationListItem[]>(open ? "/api/applications" : null, fetcher);
  const { data: companies } = useSWR<CompanyWithCounts[]>(open ? "/api/companies" : null, fetcher);
  const { data: jobs } = useSWR<JobPostingWithCompany[]>(open ? "/api/jobs" : null, fetcher);

  useEffect(() => {
    function openPalette() {
      setQuery("");
      setActiveIndex(0);
      setOpen(true);
    }
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) {
          setOpen(false);
        } else {
          openPalette();
        }
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(timer);
  }, [open]);

  const allResults: ResultItem[] = useMemo(() => {
    const actionResults: ResultItem[] = [
      { id: "act-new-app", group: "Aktionen", icon: PlusCircle, title: "Neue Bewerbung anlegen", subtitle: "Kanban & Trichter öffnen", href: "/applications" },
      { id: "act-calendar", group: "Aktionen", icon: Calendar, title: "Interview- & Terminkalender", subtitle: "Gespräche & Abgabefristen einsehen", href: "/calendar" },
      { id: "act-quiz", group: "Aktionen", icon: Zap, title: "Tech- & Coding-Quiz starten", subtitle: "React 19, TS & Web Performance trainieren", href: "/interview-prep" },
      { id: "act-voice", group: "Aktionen", icon: Mic, title: "Voice-Interview Simulator", subtitle: "Gespräch mit Audio-Dialog üben", href: "/interview-prep" },
      { id: "act-cv", group: "Aktionen", icon: FileText, title: "CV & ATS-Score prüfen", subtitle: "Lebenslauf optimieren & drucken", href: "/cv-designer" },
      { id: "act-funnel", group: "Aktionen", icon: TrendingUp, title: "Funnel-Benchmark & ROI", subtitle: "Conversion-Statistiken einsehen", href: "/analytics" },
      { id: "act-mail", group: "Aktionen", icon: Mail, title: "E-Mail IMAP-Sync", subtitle: "Posteingang abgleichen", href: "/settings" },
      { id: "act-portfolio", group: "Aktionen", icon: Share2, title: "Recruiter-Portfolio verwalten", subtitle: "One-Pager Link konfigurieren", href: "/settings" },
      { id: "act-coding", group: "Aktionen", icon: Code2, title: "Live-Coding Challenges", subtitle: "Coding-Interviews auf virtueller Tafel üben", href: "/interview-prep" },
      { id: "act-negotiation", group: "Aktionen", icon: HandCoins, title: "Gehaltsverhandlungs-Coach", subtitle: "Roleplay & Angebots-Verhandlung trainieren", href: "/interview-prep" },
      { id: "act-skillroadmap", group: "Aktionen", icon: GraduationCap, title: "Skill-Roadmap Tracker", subtitle: "Lernfortschritt zu Ziel-Skills verfolgen", href: "/analytics" },
      { id: "act-currency", group: "Aktionen", icon: Globe2, title: "Gehalts- & Umzugsrechner", subtitle: "Kaufkraft & Relocation-Kosten vergleichen", href: "/analytics" },
      { id: "act-network", group: "Aktionen", icon: Network, title: "Unternehmens-Netzwerk-Graph", subtitle: "Verbindungen zwischen Firmen visualisieren", href: "/companies" },
    ];

    const appResults: ResultItem[] = (applications ?? []).map((a) => ({
      id: `app-${a.id}`,
      group: "Bewerbungen",
      icon: Briefcase,
      title: a.position,
      subtitle: `${a.company.name}${a.tags ? ` • #${a.tags.split(",").map(t => t.trim()).join(" #")}` : ""}`,
      href: `/applications/${a.id}`,
    }));
    const companyResults: ResultItem[] = (companies ?? []).map((c) => ({
      id: `company-${c.id}`,
      group: "Unternehmen",
      icon: Building2,
      title: c.name,
      subtitle: `${c.city ?? "Unternehmen"}${c.tags ? ` • #${c.tags.split(",").map(t => t.trim()).join(" #")}` : ""}`,
      href: `/companies/${c.id}`,
    }));
    const jobResults: ResultItem[] = (jobs ?? []).map((j) => ({
      id: `job-${j.id}`,
      group: "Jobsuche",
      icon: FileSearch,
      title: j.title,
      subtitle: j.company?.name ?? "Stellenangebot",
      href: `/jobs`,
    }));
    const pageResults: ResultItem[] = [
      { id: "page-dashboard", group: "Jobsuche", icon: Briefcase, title: "Dashboard", subtitle: "Überblick & Metriken", href: "/" },
      { id: "page-apps", group: "Bewerbungen", icon: Briefcase, title: "Bewerbungen", subtitle: "Übersicht & Kanban-Board", href: "/applications" },
      { id: "page-excel", group: "Bewerbungen", icon: FileSearch, title: "Excel-Tabelle", subtitle: "Tabellarische Schnellerfassung", href: "/excel-view" },
      { id: "page-companies", group: "Unternehmen", icon: Building2, title: "Unternehmen", subtitle: "Firmenübersicht", href: "/companies" },
      { id: "page-jobs", group: "Jobsuche", icon: FileSearch, title: "Jobsuche & Parser", subtitle: "Stellenangebote durchsuchen", href: "/jobs" },
      { id: "page-prep", group: "Jobsuche", icon: FileSearch, title: "Interview-Vorbereitungsleitfaden", subtitle: "Fachfragen & Cheatsheet", href: "/interview-prep" },
      { id: "page-cv", group: "Bewerbungen", icon: Briefcase, title: "Lebenslauf-Generator (CV-Designer)", subtitle: "PDF-Vorschau & Druck", href: "/cv-designer" },
      { id: "page-analytics", group: "Bewerbungen", icon: Briefcase, title: "Auswertungen", subtitle: "Conversion Funnel & Analytics", href: "/analytics" },
      { id: "page-inbox", group: "Bewerbungen", icon: Inbox, title: "E-Mail-Antworten-Inbox", subtitle: "Erkannte Status-Vorschläge annehmen/ablehnen", href: "/inbox" },
    ];

    return [...actionResults, ...appResults, ...companyResults, ...jobResults, ...pageResults];
  }, [applications, companies, jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allResults.slice(0, 8);
    return allResults
      .filter((r) => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q))
      .slice(0, 20);
  }, [allResults, query]);

  function select(item: ResultItem) {
    router.push(item.href);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Globale Suche"
        className="w-[min(560px,92vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && filtered[activeIndex]) {
                select(filtered[activeIndex]);
              }
            }}
            placeholder="Bewerbungen, Unternehmen, Jobs, Tags durchsuchen …"
            aria-label="Suchbegriff"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        <div className="scroll-thin max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Keine Treffer gefunden.</p>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm ${
                  i === activeIndex ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-hover"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.title}</span>
                  <span className="block truncate text-xs opacity-70">{item.subtitle}</span>
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wide opacity-50">{item.group}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-hover/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Drücke <kbd className="rounded border border-border px-1 py-0.5 font-mono">↵</kbd> zum Öffnen</span>
          <span><kbd className="rounded border border-border px-1 py-0.5 font-mono">?</kbd> für alle Tastaturkürzel</span>
        </div>
      </div>
    </div>
  );
}
