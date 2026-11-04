"use client";

// -----------------------------------------------------------------------------
// Tabellenansicht der Bewerbungsliste (klassische Tabelle mit Mehrfachauswahl,
// Status-Dropdown, Tags und Meeting-Link). Ausgelagert aus
// src/app/applications/page.tsx.
// -----------------------------------------------------------------------------
import Link from "next/link";
import { ArrowUpRight, Video } from "lucide-react";
import type { ApplicationListItem } from "@/types";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { formatDate, cn } from "@/lib/core/utils";
import { APPLICATION_STATUSES } from "@/lib/core/constants";
import { parseTags, getTagStyle } from "@/lib/core/tags";
import { GhostingRadarBadge } from "@/components/applications/ghosting-radar-badge";

type Props = {
  rows: ApplicationListItem[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onStatusChange: (id: string, status: string) => void;
};

export function ApplicationsTable({ rows, loading, selectedIds, onToggleSelect, onSelectAll, onStatusChange }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="scroll-thin overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-surface-hover/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                  onChange={onSelectAll}
                  className="rounded border-border cursor-pointer"
                  title="Alle auswählen"
                />
              </th>
              <th className="px-5 py-3 font-medium">Firma</th>
              <th className="px-5 py-3 font-medium">Position & Tags</th>
              <th className="px-5 py-3 font-medium">Datum</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Nächster Schritt</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Lade Bewerbungen …
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  Keine Bewerbungen für diesen Filter gefunden.
                </td>
              </tr>
            )}
            {rows.map((app) => {
              const tags = parseTags(app.tags);
              const isSelected = selectedIds.includes(app.id);

              return (
                <tr
                  key={app.id}
                  className={cn(
                    "hover:bg-surface-hover/60 transition-colors",
                    isSelected && "bg-primary/5",
                    app.status === "SENT" && "border-l-4 border-l-amber-500",
                    app.status === "INTERVIEW" && "border-l-4 border-l-sky-500",
                    app.status === "OFFER" && "border-l-4 border-l-emerald-500",
                    app.status === "REJECTED" && "border-l-4 border-l-rose-500",
                    app.status === "WITHDRAWN" && "border-l-4 border-l-slate-400",
                    app.status === "DRAFT" && "border-l-4 border-l-slate-300"
                  )}
                >
                  <td className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(app.id)}
                      className="rounded border-border cursor-pointer"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/applications/${app.id}`} className="font-semibold text-foreground hover:underline">
                      {app.company.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{app.position}</span>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((t) => (
                            <span
                              key={t}
                              className={cn("rounded px-1.5 py-0.2 text-[10px] font-semibold", getTagStyle(t))}
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDate(app.applicationDate)}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <label className="sr-only" htmlFor={`status-${app.id}`}>
                        Status für {app.position}
                      </label>
                      <Select
                        id={`status-${app.id}`}
                        value={app.status}
                        onChange={(e) => onStatusChange(app.id, e.target.value)}
                        className="h-8 w-auto py-1 text-xs font-semibold"
                      >
                        {APPLICATION_STATUSES.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </Select>
                      <GhostingRadarBadge application={app} />
                    </div>
                  </td>
                  <td className="max-w-[220px] px-5 py-3 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{app.nextStep ?? "—"}</span>
                      {app.meetingUrl && (
                        <a
                          href={app.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-primary-soft p-1 text-primary hover:bg-primary hover:text-white transition-colors shrink-0"
                          title="Online-Meeting beitreten"
                        >
                          <Video className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/applications/${app.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Details <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
