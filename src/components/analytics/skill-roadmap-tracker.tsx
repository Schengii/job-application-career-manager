"use client";

// -----------------------------------------------------------------------------
// Skill-Roadmap & Lernziel-Tracker für Frontend-Entwickler
// -----------------------------------------------------------------------------
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  Circle,
  Plus,
  Flame,
  Award,
  ArrowUpRight,
  Sparkles,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DEFAULT_SKILL_GOALS,
  SkillGoal,
  Milestone,
  calculateSkillGoalProgress,
  calculateTotalRoadmapProgress,
} from "@/lib/skillRoadmap";

export function SkillRoadmapTracker() {
  const [goals, setGoals] = useState<SkillGoal[]>(DEFAULT_SKILL_GOALS);
  const [newMilestoneText, setNewMilestoneText] = useState("");
  const [selectedGoalId, setSelectedGoalId] = useState<string>(DEFAULT_SKILL_GOALS[0].id);

  const stats = useMemo(() => calculateTotalRoadmapProgress(goals), [goals]);

  function toggleMilestone(goalId: string, milestoneId: string) {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          milestones: g.milestones.map((m) =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          ),
        };
      })
    );
  }

  function handleAddMilestone(goalId: string) {
    if (!newMilestoneText.trim()) return;
    const newM: Milestone = {
      id: `m-custom-${Date.now()}`,
      title: newMilestoneText.trim(),
      category: "Frontend",
      completed: false,
    };
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, milestones: [...g.milestones, newM] } : g))
    );
    setNewMilestoneText("");
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 space-y-6">
      {/* Header mit Gesamtfortschritt */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Persönliche Skill- & Lernziel-Roadmap
            </h2>
            <p className="text-xs text-muted-foreground">
              Gezielter Ausbau von Kernkompetenzen für Fachinformatiker Anwendungsentwicklung
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-muted-foreground block">Roadmap-Fortschritt</span>
            <span className="text-xs font-bold text-foreground">
              {stats.completedMilestones} von {stats.totalMilestones} Meilensteinen ({stats.overallPercentage}%)
            </span>
          </div>
          <div className="h-3 w-28 rounded-full bg-surface-hover border border-border/80 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${stats.overallPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid der Lernziel-Module */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {goals.map((goal) => {
          const progress = calculateSkillGoalProgress(goal);

          return (
            <Card key={goal.id} className="border-border/80 bg-surface-hover/20">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-bold">
                        Level: {goal.targetLevel}
                      </span>
                      <span className="flex items-center gap-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">
                        <Flame className="h-3 w-3" /> {goal.marketRelevancePct}% Marktrelevanz
                      </span>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground">{goal.title}</CardTitle>
                  </div>
                  <span className="text-xs font-bold text-primary shrink-0">{progress}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {goal.description}
                </p>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-border mt-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2.5">
                <div className="space-y-1.5">
                  {goal.milestones.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMilestone(goal.id, m.id)}
                      className={`group flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        m.completed
                          ? "border-emerald-500/30 bg-emerald-500/5 text-foreground"
                          : "border-border bg-surface hover:bg-surface-hover/80 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {m.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={`truncate ${m.completed ? "line-through opacity-80" : ""}`}>
                          {m.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {m.dueDate && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {m.dueDate}
                          </span>
                        )}
                        {m.challengeRefId && (
                          <Link
                            href="/interview-prep"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:underline bg-primary/10 px-1.5 py-0.5 rounded"
                          >
                            Challenge <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Eigenen Meilenstein hinzufügen */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  <input
                    type="text"
                    placeholder="Neuen Meilenstein hinzufügen …"
                    value={selectedGoalId === goal.id ? newMilestoneText : ""}
                    onFocus={() => setSelectedGoalId(goal.id)}
                    onChange={(e) => setNewMilestoneText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddMilestone(goal.id)}
                    className="h-7 flex-1 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddMilestone(goal.id)}
                    className="h-7 text-xs px-2"
                  >
                    <Plus className="h-3 w-3" /> Hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
