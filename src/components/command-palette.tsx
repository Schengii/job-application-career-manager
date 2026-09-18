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

type GroupFilter = "ALL" | "Aktionen" | "Bewerbungen" | "Unternehmen" | "Jobsuche";

type ResultItem = {
  id: string;
  group: "Aktionen" | "Bewerbungen" | "Unternehmen" | "Jobsuche";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  href: string;
  keywords?: string[];
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupFilter>("ALL");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Nutzt denselben SWR-Cache wie die jeweiligen Seiten – kein Zusatz-Request,
  // solange die Seiten schon einmal besucht wurden; sonst wird einmalig geladen.
  const { data: applications } = useSWR<ApplicationListItem[]>(open ? "/api/applications" : null, fetcher);
  const { data: companies } = useSWR<CompanyWithCounts[]>(open ? "/api/companies" : null, fetcher);
  const { data: jobs } = useSWR<JobPostingWithCompany[]>(open ? "/api/jobs" : null, fetcher);

  useEffect(() => {
    function openPalette() {
      setQuery("");
      setSelectedGroup("ALL");
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
      { id: "act-new-app", group: "Aktionen", icon: PlusCircle, title: "Neue Bewerbung anlegen", subtitle: "Kanban & Trichter öffnen", href: "/applications", keywords: ["neu", "anlegen", "erstellen", "add"] },
      { id: "act-calendar", group: "Aktionen", icon: Calendar, title: "Interview- & Terminkalender", subtitle: "Gespräche & Abgabefristen einsehen", href: "/calendar", keywords: ["kalender", "termine", "interviews", "agenda"] },
      { id: "act-quiz", group: "Aktionen", icon: Zap, title: "Tech- & Coding-Quiz starten", subtitle: "React 19, TS & Web Performance trainieren", href: "/interview-prep", keywords: ["quiz", "test", "fragen", "react 19", "typescript"] },
      { id: "act-voice", group: "Aktionen", icon: Mic, title: "Voice-Interview Simulator", subtitle: "Gespräch mit Audio-Dialog üben", href: "/interview-prep", keywords: ["audio", "stimme", "simulator", "dialog", "mikrofon"] },
      { id: "act-cv", group: "Aktionen", icon: FileText, title: "CV & ATS-Score prüfen", subtitle: "Lebenslauf optimieren & drucken", href: "/cv-designer", keywords: ["lebenslauf", "cv", "resume", "ats", "pdf"] },
      { id: "act-funnel", group: "Aktionen", icon: TrendingUp, title: "Funnel-Benchmark & ROI", subtitle: "Conversion-Statistiken einsehen", href: "/analytics", keywords: ["statistik", "roi", "funnel", "analytics", "metriken"] },
      { id: "act-mail", group: "Aktionen", icon: Mail, title: "E-Mail IMAP-Sync", subtitle: "Posteingang abgleichen", href: "/settings", keywords: ["email", "imap", "sync", "postfach"] },
      { id: "act-portfolio", group: "Aktionen", icon: Share2, title: "Recruiter-Portfolio verwalten", subtitle: "One-Pager Link konfigurieren", href: "/settings", keywords: ["portfolio", "share", "recruiter", "link"] },
      { id: "act-coding", group: "Aktionen", icon: Code2, title: "Live-Coding Challenges", subtitle: "Coding-Interviews auf virtueller Tafel üben", href: "/interview-prep", keywords: ["code", "challenge", "sandbox", "javascript"] },
      { id: "act-negotiation", group: "Aktionen", icon: HandCoins, title: "Gehaltsverhandlungs-Coach", subtitle: "Roleplay & Angebots-Verhandlung trainieren", href: "/interview-prep", keywords: ["gehalt", "verhandlung", "coach", "angebot"] },
      { id: "act-skillroadmap", group: "Aktionen", icon: GraduationCap, title: "Skill-Roadmap Tracker", subtitle: "Lernfortschritt zu Ziel-Skills verfolgen", href: "/analytics", keywords: ["skills", "lernen", "roadmap", "ziele"] },
      { id: "act-currency", group: "Aktionen", icon: Globe2, title: "Gehalts- & Umzugsrechner", subtitle: "Kaufkraft & Relocation-Kosten vergleichen", href: "/analytics", keywords: ["währung", "relocation", "chf", "usd", "umzug"] },
      { id: "act-network", group: "Aktionen", icon: Network, title: "Unternehmens-Netzwerk-Graph", subtitle: "Verbindungen zwischen Firmen visualisieren", href: "/companies", keywords: ["netzwerk", "graph", "beziehungen"] },
    ];

    const appResults: ResultItem[] = (applications ?? []).map((a) => ({
      id: `app-${a.id}`,
      group: "Bewerbungen",
      icon: Briefcase,
      title: a.position,
      subtitle: `${a.company.name}${a.company.city ? ` (${a.company.city})` : ""}${a.tags ? ` • #${a.tags.split(",").map(t => t.trim()).join(" #")}` : ""}`,
      href: `/applications/${a.id}`,
      keywords: [
        a.company.name,
        a.company.city ?? "",
        a.status,
        a.notes ?? "",
        ...(a.tags ? a.tags.split(",").map(t => t.trim()) : []),
        a.jobPosting?.techStack ?? "",
      ].filter(Boolean),
    }));

    const companyResults: ResultItem[] = (companies ?? []).map((c) => ({
      id: `company-${c.id}`,
      group: "Unternehmen",
      icon: Building2,
      title: c.name,
      subtitle: `${c.city ?? "Unternehmen"}${c.contactName ? ` • z.Hd. ${c.contactName}` : ""}${c.tags ? ` • #${c.tags.split(",").map(t => t.trim()).join(" #")}` : ""}`,
      href: `/companies/${c.id}`,
      keywords: [
        c.city ?? "",
        c.contactName ?? "",
        c.contactEmail ?? "",
        c.notes ?? "",
        ...(c.tags ? c.tags.split(",").map(t => t.trim()) : []),
      ].filter(Boolean),
    }));

    const jobResults: ResultItem[] = (jobs ?? []).map((j) => ({
      id: `job-${j.id}`,
      group: "Jobsuche",
      icon: FileSearch,
      title: j.title,
      subtitle: `${j.company?.name ?? "Stellenangebot"}${j.location ? ` • ${j.location}` : ""}`,
      href: `/jobs`,
      keywords: [
        j.company?.name ?? "",
        j.location ?? "",
        j.techStack ?? "",
        j.portalSource ?? "",
      ].filter(Boolean),
    }));

    const pageResults: ResultItem[] = [
      { id: "page-dashboard", group: "Jobsuche", icon: Briefcase, title: "Dashboard", subtitle: "Überblick & Metriken", href: "/", keywords: ["home", "start", "übersicht"] },
      { id: "page-apps", group: "Bewerbungen", icon: Briefcase, title: "Bewerbungen", subtitle: "Übersicht & Kanban-Board", href: "/applications", keywords: ["kanban", "trichter", "board"] },
      { id: "page-excel", group: "Bewerbungen", icon: FileSearch, title: "Excel-Tabelle", subtitle: "Tabellarische Schnellerfassung", href: "/excel-view", keywords: ["tabelle", "grid", "sheet"] },
      { id: "page-companies", group: "Unternehmen", icon: Building2, title: "Unternehmen", subtitle: "Firmenübersicht", href: "/companies", keywords: ["firmen", "arbeitgeber"] },
      { id: "page-jobs", group: "Jobsuche", icon: FileSearch, title: "Jobsuche & Parser", subtitle: "Stellenangebote durchsuchen", href: "/jobs", keywords: ["crawler", "stellen", "angebote"] },
      { id: "page-prep", group: "Jobsuche", icon: FileSearch, title: "Interview-Vorbereitungsleitfaden", subtitle: "Fachfragen & Cheatsheet", href: "/interview-prep", keywords: ["vorbereitung", "leitfaden"] },
      { id: "page-cv", group: "Bewerbungen", icon: Briefcase, title: "Lebenslauf-Generator (CV-Designer)", subtitle: "PDF-Vorschau & Druck", href: "/cv-designer", keywords: ["lebenslauf", "cv"] },
      { id: "page-analytics", group: "Bewerbungen", icon: Briefcase, title: "Auswertungen", subtitle: "Conversion Funnel & Analytics", href: "/analytics", keywords: ["analytics", "roi"] },
      { id: "page-inbox", group: "Bewerbungen", icon: Inbox, title: "E-Mail-Antworten-Inbox", subtitle: "Erkannte Status-Vorschläge annehmen/ablehnen", href: "/inbox", keywords: ["inbox", "posteingang"] },
    ];

    return [...actionResults, ...appResults, ...companyResults, ...jobResults, ...pageResults];
  }, [applications, companies, jobs]);

  const filtered = useMemo(() => {
    let list = allResults;
    if (selectedGroup !== "ALL") {
      list = list.filter((r) => r.group === selectedGroup);
    }

    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return list.slice(0, 8);

    // Multi-Token Match: Jedes einzelne Wort der Suchanfrage muss vorkommen
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    return list
      .filter((r) => {
        const searchableText = `${r.title} ${r.subtitle} ${(r.keywords ?? []).join(" ")}`.toLowerCase();
        return tokens.every((token) => searchableText.includes(token));
      })
      .slice(0, 25);
  }, [allResults, query, selectedGroup]);

  // Automatisches Scrollen zum ausgewählten Element
  useEffect(() => {
    if (!listRef.current) return;
    const activeElem = listRef.current.children[activeIndex] as HTMLElement | undefined;
    if (activeElem && typeof activeElem.scrollIntoView === "function") {
      activeElem.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function select(item: ResultItem) {
    router.push(item.href);
    setOpen(false);
  }

  if (!open) return null;

  const GROUPS: { key: GroupFilter; label: string }[] = [
    { key: "ALL", label: "Alle" },
    { key: "Bewerbungen", label: "Bewerbungen" },
    { key: "Unternehmen", label: "Firmen" },
    { key: "Jobsuche", label: "Jobs & Seiten" },
    { key: "Aktionen", label: "Quick-Actions" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 pt-[10vh] animate-fade-in" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Globale Suche"
        className="w-[min(620px,94vw)] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <SearchIcon className="h-4 w-4 shrink-0 text-primary" />
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
            placeholder="Multi-Token-Suche: Firma, Position, Tech-Stack, Stadt …"
            aria-label="Suchbegriff"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            Esc
          </kbd>
        </div>

        {/* Filter-Pills */}
        <div className="flex items-center gap-1.5 border-b border-border/60 bg-surface-hover/20 px-4 py-1.5 overflow-x-auto scroll-thin">
          {GROUPS.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => {
                setSelectedGroup(g.key);
                setActiveIndex(0);
              }}
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                selectedGroup === g.key
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div ref={listRef} className="scroll-thin max-h-[52vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Keine passenden Treffer gefunden.</p>
          )}
          {filtered.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => select(item)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  i === activeIndex ? "bg-primary-soft text-primary font-medium" : "text-foreground hover:bg-surface-hover"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-80" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{item.title}</span>
                  <span className="block truncate text-xs opacity-70">{item.subtitle}</span>
                </span>
                <span className="shrink-0 text-[10px] uppercase font-semibold tracking-wider opacity-60 rounded bg-surface-hover px-1.5 py-0.5">
                  {item.group}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-hover/30 px-4 py-2 text-[11px] text-muted-foreground">
          <span>Drücke <kbd className="rounded border border-border px-1 py-0.5 font-mono">↵</kbd> zum Öffnen • <kbd className="rounded border border-border px-1 py-0.5 font-mono">↑</kbd><kbd className="rounded border border-border px-1 py-0.5 font-mono">↓</kbd> zum Navigieren</span>
          <span>{filtered.length} Treffer</span>
        </div>
      </div>
    </div>
  );
}
