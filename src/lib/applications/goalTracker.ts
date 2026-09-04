// -----------------------------------------------------------------------------
// Goal Tracker & Streak Engine
// -----------------------------------------------------------------------------
// Berechnet den Fortschritt für wöchentliche Bewerbungsziele,
// aktive Streaks (Tage in Folge) und erreichte Meilensteine.
// -----------------------------------------------------------------------------
import type { ApplicationListItem } from "@/types";

export type GoalStats = {
  weeklyGoal: number;
  currentWeekCount: number;
  weeklyProgressPct: number;
  isGoalReached: boolean;
  activeStreakDays: number;
  totalApplications: number;
  interviewsCount: number;
  offersCount: number;
  milestones: Milestone[];
};

export type Milestone = {
  id: string;
  title: string;
  description: string;
  achieved: boolean;
  icon: string;
};

/**
 * Ermittelt Montag 00:00:00 Uhr der aktuellen Woche für den ISO-Wochenstart.
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Berechnet Ziel- und Streak-Statistiken auf Basis der Bewerbungsliste.
 */
export function calculateGoalStats(
  applications: ApplicationListItem[] = [],
  weeklyGoal: number = 5,
  referenceDate: Date = new Date()
): GoalStats {
  const safeGoal = Math.max(1, weeklyGoal || 5);
  const startOfWeek = getStartOfWeek(referenceDate);

  // 1. Zähle Bewerbungen in der aktuellen Woche (ab Montag)
  const currentWeekApps = applications.filter((app) => {
    const appDate = app.applicationDate ? new Date(app.applicationDate) : new Date(app.createdAt);
    return appDate >= startOfWeek && appDate <= referenceDate;
  });

  const currentWeekCount = currentWeekApps.length;
  const weeklyProgressPct = Math.min(100, Math.round((currentWeekCount / safeGoal) * 100));
  const isGoalReached = currentWeekCount >= safeGoal;

  // 2. Berechne Streak (Tage in Folge, an denen mindestens eine Bewerbung angelegt oder verschickt wurde)
  const activityDates = new Set<string>();
  for (const app of applications) {
    const d = app.applicationDate ? new Date(app.applicationDate) : new Date(app.createdAt);
    activityDates.add(d.toISOString().slice(0, 10));
    if (app.updatedAt) {
      activityDates.add(new Date(app.updatedAt).toISOString().slice(0, 10));
    }
  }

  let streak = 0;
  const checkDate = new Date(referenceDate);
  checkDate.setHours(0, 0, 0, 0);

  // Prüfe ob heute Aktivität da war, falls nicht starte von gestern
  const todayStr = checkDate.toISOString().slice(0, 10);
  const hasActivityToday = activityDates.has(todayStr);

  if (hasActivityToday) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Wenn heute noch nichts war, prüfe ob gestern aktiv war
    const yesterday = new Date(checkDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (!activityDates.has(yesterdayStr)) {
      streak = 0;
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  while (streak > 0 || hasActivityToday) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    if (activityDates.has(dateStr)) {
      if (!hasActivityToday && streak === 0) {
        streak = 1;
      } else if (hasActivityToday || streak > 0) {
        streak++;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 3. Meilensteine
  const total = applications.length;
  const interviews = applications.filter((a) => a.status === "INTERVIEW" || a.status === "OFFER").length;
  const offers = applications.filter((a) => a.status === "OFFER").length;

  const milestones: Milestone[] = [
    {
      id: "first_app",
      title: "Erster Schritt",
      description: "Erste Bewerbung erfolgreich erfasst",
      achieved: total >= 1,
      icon: "Sparkles",
    },
    {
      id: "five_apps",
      title: "Bewerbungs-Power",
      description: "5 Bewerbungen im Rennen",
      achieved: total >= 5,
      icon: "Briefcase",
    },
    {
      id: "ten_apps",
      title: "Pipeline Meister",
      description: "10+ Bewerbungen aktiv gemanagt",
      achieved: total >= 10,
      icon: "Zap",
    },
    {
      id: "weekly_goal",
      title: "Wochenziel geknackt",
      description: `Wochenziel von ${safeGoal} Bewerbungen erreicht`,
      achieved: isGoalReached,
      icon: "Target",
    },
    {
      id: "first_interview",
      title: "Interview Einladung",
      description: "Erstes Vorstellungsgespräch vereinbart",
      achieved: interviews >= 1,
      icon: "CalendarCheck",
    },
    {
      id: "first_offer",
      title: "Erfolgreiches Angebot",
      description: "Zusage oder Angebot erhalten",
      achieved: offers >= 1,
      icon: "Trophy",
    },
  ];

  return {
    weeklyGoal: safeGoal,
    currentWeekCount,
    weeklyProgressPct,
    isGoalReached,
    activeStreakDays: streak,
    totalApplications: total,
    interviewsCount: interviews,
    offersCount: offers,
    milestones,
  };
}
