"use client";

// -----------------------------------------------------------------------------
// Interaktive Recruiter-Netzwerk-Karte & Firmen-Relations-Graph
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Network,
  Building2,
  Users,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  ExternalLink,
  Filter,
} from "lucide-react";
import type { CompanyWithCounts } from "@/types";
import { CompanyStatusBadge } from "@/components/status-badge";

type HubGroup = {
  id: string;
  name: string;
  color: string;
  companies: CompanyWithCounts[];
};

export function CompanyNetworkGraph({ companies }: { companies: CompanyWithCounts[] }) {
  const [filterWithRecruiterOnly, setFilterWithRecruiterOnly] = useState(false);
  const [selectedHub, setSelectedHub] = useState<string>("ALL");

  const hubs = useMemo<HubGroup[]>(() => {
    const list = filterWithRecruiterOnly
      ? companies.filter((c) => c.contactName || c.contactEmail || c.contactPhone)
      : companies;

    const rheinland = list.filter((c) => {
      const city = (c.city || "").toLowerCase();
      return city.includes("bonn") || city.includes("köln") || city.includes("koeln") || city.includes("siegburg") || city.includes("troisdorf");
    });

    const ruhrgebiet = list.filter((c) => {
      const city = (c.city || "").toLowerCase();
      return city.includes("dortmund") || city.includes("düsseldorf") || city.includes("duesseldorf") || city.includes("essen") || city.includes("bochum");
    });

    const remoteOrGermany = list.filter((c) => {
      const city = (c.city || "").toLowerCase();
      return city.includes("remote") || city.includes("berlin") || city.includes("münchen") || city.includes("frankfurt") || city.includes("hamburg");
    });

    const others = list.filter((c) => {
      return !rheinland.includes(c) && !ruhrgebiet.includes(c) && !remoteOrGermany.includes(c);
    });

    return [
      { id: "RHEINLAND", name: "Rheinland (Bonn / Köln / Region)", color: "from-indigo-500 to-sky-500", companies: rheinland },
      { id: "RUHRGEBIET", name: "Ruhrgebiet & NRW (Dortmund / Düsseldorf)", color: "from-amber-500 to-orange-500", companies: ruhrgebiet },
      { id: "REMOTE_DE", name: "Remote & Tech-Zentren (Berlin / FFM / MUC)", color: "from-emerald-500 to-teal-500", companies: remoteOrGermany },
      { id: "OTHERS", name: "Weitere Standorte & Initiativ-Pool", color: "from-purple-500 to-pink-500", companies: others },
    ].filter((h) => h.companies.length > 0);
  }, [companies, filterWithRecruiterOnly]);

  const totalContacts = useMemo(() => {
    return companies.filter((c) => c.contactName || c.contactEmail || c.contactPhone).length;
  }, [companies]);

  const activeInterviews = useMemo(() => {
    return companies.filter((c) => c.status === "INTERVIEW" || c.status === "OFFER").length;
  }, [companies]);

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
      {/* Header mit Netzwerk-Metriken */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Network className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Firmen- & Recruiter-Netzwerk-Graph</h2>
            <p className="text-xs text-muted-foreground">
              Standort-Cluster, direkte Ansprechpartner und Bewerbungsverbindungen
            </p>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterWithRecruiterOnly(!filterWithRecruiterOnly)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              filterWithRecruiterOnly
                ? "bg-primary text-white"
                : "border border-border bg-surface-hover/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {filterWithRecruiterOnly ? "Nur mit Ansprechpartner ✓" : "Nur mit Ansprechpartner"}
          </button>
        </div>
      </div>

      {/* KPI Kacheln */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-surface-hover/40 p-3 text-center">
          <span className="text-[11px] text-muted-foreground block">Erfasste Firmen</span>
          <span className="text-lg font-bold text-foreground mt-0.5 block">{companies.length}</span>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary-soft/30 p-3 text-center">
          <span className="text-[11px] text-primary font-semibold block">Ansprechpartner</span>
          <span className="text-lg font-extrabold text-primary mt-0.5 block">{totalContacts}</span>
        </div>
        <div className="rounded-xl border border-border/80 bg-surface-hover/40 p-3 text-center">
          <span className="text-[11px] text-muted-foreground block">Interview/Offer Firmen</span>
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {activeInterviews}
          </span>
        </div>
        <div className="rounded-xl border border-border/80 bg-surface-hover/40 p-3 text-center">
          <span className="text-[11px] text-muted-foreground block">Regionale Hubs</span>
          <span className="text-lg font-bold text-foreground mt-0.5 block">{hubs.length}</span>
        </div>
      </div>

      {/* Hub Clusters & Connected Company Nodes */}
      <div className="space-y-6">
        {hubs.map((hub) => (
          <div key={hub.id} className="rounded-xl border border-border/70 bg-surface-hover/20 p-4 space-y-3">
            {/* Hub Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full bg-gradient-to-r ${hub.color}`} />
                <span className="text-xs font-bold text-foreground">{hub.name}</span>
              </div>
              <span className="rounded-full bg-surface border border-border px-2 py-0.5 text-[10.5px] font-semibold text-muted-foreground">
                {hub.companies.length} Unternehmen
              </span>
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {hub.companies.map((c) => (
                <Link
                  key={c.id}
                  href={`/companies/${c.id}`}
                  className="group block rounded-lg border border-border/80 bg-surface p-3 transition-all hover:border-primary/50 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {c.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        {c.city || "Standort n.a."}
                      </p>
                    </div>
                    <CompanyStatusBadge status={c.status} />
                  </div>

                  {/* Recruiter / Ansprechpartner Badge */}
                  {(c.contactName || c.contactEmail) && (
                    <div className="mt-2.5 rounded-md bg-primary/5 border border-primary/20 p-1.5 text-[10.5px] space-y-0.5">
                      {c.contactName && (
                        <p className="font-semibold text-primary truncate flex items-center gap-1">
                          <Users className="h-3 w-3 shrink-0" /> {c.contactName}
                        </p>
                      )}
                      {c.contactEmail && (
                        <p className="text-muted-foreground truncate flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" /> {c.contactEmail}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-muted-foreground border-t border-border/50 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {c._count.applications} {c._count.applications === 1 ? "Bewerbung" : "Bewerbungen"}
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Details <ExternalLink className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
