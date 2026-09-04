"use client";

import { useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  Target,
  Flame,
  Trophy,
  Sparkles,
  Zap,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { fetcher } from "@/lib/core/api";
import type { ApplicationListItem, PreferencesWithProfile } from "@/types";
import { calculateGoalStats, Milestone } from "@/lib/applications/goalTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/core/utils";

const ICON_MAP: Record<string, typeof Sparkles> = {
  Sparkles,
  Briefcase,
  Zap,
  Target,
  CalendarCheck,
  Trophy,
};

export function GoalTrackerCard() {
  const { data: applications, isLoading: appsLoading } = useSWR<ApplicationListItem[]>(
    "/api/applications",
    fetcher
  );
  const { data: preferences, isLoading: prefsLoading } = useSWR<PreferencesWithProfile>(
    "/api/preferences",
    fetcher
  );

  const weeklyGoal = preferences?.weeklyGoal ?? 5;

  const stats = useMemo(() => {
    return calculateGoalStats(applications ?? [], weeklyGoal);
  }, [applications, weeklyGoal]);

  if (appsLoading || prefsLoading) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-surface to-surface shadow-xs">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Target className="h-5 w-5 text-primary animate-pulse-subtle" />
          <span>Wochenziel & Bewerbungs-Streak</span>
        </CardTitle>
        <Link
          href="/settings"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          title="Wochenziel in den Einstellungen anpassen"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>Ziel anpassen</span>
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Wochenfortschritt & Streak Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Wochenziel */}
          <div className="rounded-xl border border-border/80 bg-surface/80 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">Aktuelle Kalenderwoche</span>
              <span className="font-bold text-foreground">
                {stats.currentWeekCount} von {stats.weeklyGoal} Bewerbungen
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-border/60">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  stats.isGoalReached
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-primary to-indigo-500"
                )}
                style={{ width: `${stats.weeklyProgressPct}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">
                {stats.isGoalReached ? "🎉 Wochenziel erreicht!" : `${stats.weeklyProgressPct}% geschafft`}
              </span>
              {!stats.isGoalReached && (
                <span className="text-primary font-semibold">
                  Noch {stats.weeklyGoal - stats.currentWeekCount} übrig
                </span>
              )}
            </div>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/80 p-3.5">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Aktivitäts-Streak</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-foreground">
                  {stats.activeStreakDays}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {stats.activeStreakDays === 1 ? "Tag aktiv" : "Tage in Folge"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stats.activeStreakDays > 0
                  ? "Großartig! Bleib am Ball!"
                  : "Erfasse heute eine Aktivität, um die Streak zu starten."}
              </p>
            </div>

            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl border shadow-inner transition-transform",
                stats.activeStreakDays > 0
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-500 scale-105 animate-pulse-subtle"
                  : "border-border bg-surface-hover text-muted-foreground/40"
              )}
            >
              <Flame className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Meilensteine */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            <span>Erreichte Meilensteine</span>
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {stats.milestones.map((m: Milestone) => {
              const Icon = ICON_MAP[m.icon] || Sparkles;
              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-all",
                    m.achieved
                      ? "border-primary/40 bg-primary-soft/40 shadow-xs"
                      : "border-border/50 bg-surface/40 opacity-40 grayscale"
                  )}
                  title={`${m.title}: ${m.description}`}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full mb-1",
                      m.achieved
                        ? "bg-primary text-white shadow-xs"
                        : "bg-surface-hover text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-[11px] font-bold text-foreground truncate w-full">{m.title}</p>
                  {m.achieved && (
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Freigeschaltet
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
