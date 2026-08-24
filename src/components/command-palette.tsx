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
import { Briefcase, Building2, Search as SearchIcon, FileSearch } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem, CompanyWithCounts, JobPostingWithCompany } from "@/types";

type ResultItem = {
  id: string;
  group: "Bewerbungen" | "Unternehmen" | "Jobsuche";
  icon: typeof Briefcase;
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
    // Reset von Suchbegriff/Auswahl passiert bewusst hier im Event-Handler
    // (ausgelöst durch die tatsächliche Nutzer-Aktion "öffnen"), nicht in
    // einem separaten Effekt, der bei jeder open-Änderung erneut feuern würde.
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
    // Erlaubt einen sichtbaren Such-Button (z.B. in der Sidebar), die Palette
    // ohne eigenen Shared-State über ein einfaches DOM-Event zu öffnen.
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("open-command-palette", openPalette);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("open-command-palette", openPalette);
    };
  }, [open]);

  // Reiner Seiteneffekt auf ein externes System (DOM-Fokus) – kein setState,
  // daher unproblematisch für die react-hooks/set-state-in-effect-Regel.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(timer);
  }, [open]);

  const allResults: ResultItem[] = useMemo(() => {
    const appResults: ResultItem[] = (applications ?? []).map((a) => ({
      id: `app-${a.id}`,
      group: "Bewerbungen",
      icon: Briefcase,
      title: a.position,
      subtitle: a.company.name,
      href: `/applications/${a.id}`,
    }));
    const companyResults: ResultItem[] = (companies ?? []).map((c) => ({
      id: `company-${c.id}`,
      group: "Unternehmen",
      icon: Building2,
      title: c.name,
      subtitle: c.city ?? "Unternehmen",
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
    return [...appResults, ...companyResults, ...jobResults];
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
            placeholder="Bewerbungen, Unternehmen, Jobs durchsuchen …"
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
      </div>
    </div>
  );
}
