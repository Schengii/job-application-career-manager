// -----------------------------------------------------------------------------
// Response-Heatmap & Bewerbungs-Timing Analytics
// -----------------------------------------------------------------------------
// Berechnet aggregierte Statistiken über den Absendezeitpunkt von Bewerbungen:
// - Wochentags-Verteilung (Montag bis Sonntag)
// - Uhrzeit-Slots (Morgen 06-11 Uhr, Mittag 11-14 Uhr, Nachmittag 14-18 Uhr, Abend/Nacht 18-06 Uhr)
// - Interview- & Rückmelderate je Wochentag & Zeitslot
// - Erkennt das optimale "Bewerbungs-Fenster" mit den höchsten Response-Chancen
// -----------------------------------------------------------------------------

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sonntag, 1=Montag, ..., 6=Samstag

export const DAY_NAMES: Record<number, string> = {
  1: "Montag",
  2: "Dienstag",
  3: "Mittwoch",
  4: "Donnerstag",
  5: "Freitag",
  6: "Samstag",
  0: "Sonntag",
};

export type TimeSlot = "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING";

export const TIME_SLOT_CONFIG: Record<TimeSlot, { label: string; hours: string; icon: string }> = {
  MORNING: { label: "Morgen", hours: "06:00 - 11:00", icon: "🌅" },
  MIDDAY: { label: "Mittag", hours: "11:00 - 14:00", icon: "☀️" },
  AFTERNOON: { label: "Nachmittag", hours: "14:00 - 18:00", icon: "☕" },
  EVENING: { label: "Abend / Nacht", hours: "18:00 - 06:00", icon: "🌙" },
};

export function getTimeSlot(date: Date): TimeSlot {
  const h = date.getHours();
  if (h >= 6 && h < 11) return "MORNING";
  if (h >= 11 && h < 14) return "MIDDAY";
  if (h >= 14 && h < 18) return "AFTERNOON";
  return "EVENING";
}

export type ApplicationTimingInput = {
  id: string;
  createdAt: Date | string;
  applicationDate?: Date | string | null;
  status: string;
  statusEvents?: { status: string }[];
};

export type DayTimingStat = {
  dayIndex: number;
  dayName: string;
  totalApplications: number;
  interviewCount: number;
  interviewRate: number; // in %
  respondedCount: number;
  responseRate: number; // in %
};

export type SlotTimingStat = {
  slot: TimeSlot;
  label: string;
  hours: string;
  icon: string;
  totalApplications: number;
  interviewCount: number;
  interviewRate: number; // in %
};

export type HeatmapCell = {
  dayIndex: number;
  dayName: string;
  slot: TimeSlot;
  total: number;
  interviews: number;
};

export type TimingAnalyticsResult = {
  totalAnalyzed: number;
  dayStats: DayTimingStat[];
  slotStats: SlotTimingStat[];
  heatmapGrid: HeatmapCell[];
  bestDay: string | null;
  bestSlot: string | null;
  recommendation: string;
};

const RESPONSE_STATUSES = new Set(["INTERVIEW", "OFFER", "REJECTED"]);

export function computeResponseTimingAnalytics(
  applications: ApplicationTimingInput[]
): TimingAnalyticsResult {
  if (!applications || applications.length === 0) {
    return {
      totalAnalyzed: 0,
      dayStats: [1, 2, 3, 4, 5, 6, 0].map((d) => ({
        dayIndex: d,
        dayName: DAY_NAMES[d],
        totalApplications: 0,
        interviewCount: 0,
        interviewRate: 0,
        respondedCount: 0,
        responseRate: 0,
      })),
      slotStats: (["MORNING", "MIDDAY", "AFTERNOON", "EVENING"] as TimeSlot[]).map((slot) => ({
        slot,
        ...TIME_SLOT_CONFIG[slot],
        totalApplications: 0,
        interviewCount: 0,
        interviewRate: 0,
      })),
      heatmapGrid: [],
      bestDay: null,
      bestSlot: null,
      recommendation: "Lege erste Bewerbungen an, um optimale Absendezeiten zu analysieren.",
    };
  }

  // Initialisieren der Wochentage (Reihenfolge: Mo, Di, Mi, Do, Fr, Sa, So)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];
  const dayBuckets = new Map<
    number,
    { total: number; interviews: number; responded: number }
  >();
  for (const d of orderedDays) {
    dayBuckets.set(d, { total: 0, interviews: 0, responded: 0 });
  }

  const slotBuckets = new Map<
    TimeSlot,
    { total: number; interviews: number }
  >();
  for (const s of ["MORNING", "MIDDAY", "AFTERNOON", "EVENING"] as TimeSlot[]) {
    slotBuckets.set(s, { total: 0, interviews: 0 });
  }

  const gridMap = new Map<string, { total: number; interviews: number }>();
  for (const d of orderedDays) {
    for (const s of ["MORNING", "MIDDAY", "AFTERNOON", "EVENING"] as TimeSlot[]) {
      gridMap.set(`${d}-${s}`, { total: 0, interviews: 0 });
    }
  }

  let totalAnalyzed = 0;

  for (const app of applications) {
    const rawDate = app.applicationDate || app.createdAt;
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) continue;

    totalAnalyzed++;
    const day = date.getDay();
    const slot = getTimeSlot(date);

    const isInterview =
      app.status === "INTERVIEW" ||
      app.status === "OFFER" ||
      (app.statusEvents || []).some((e) => e.status === "INTERVIEW" || e.status === "OFFER");

    const hasResponded =
      RESPONSE_STATUSES.has(app.status) ||
      (app.statusEvents || []).some((e) => RESPONSE_STATUSES.has(e.status));

    // Day
    const dayB = dayBuckets.get(day);
    if (dayB) {
      dayB.total++;
      if (isInterview) dayB.interviews++;
      if (hasResponded) dayB.responded++;
    }

    // Slot
    const slotB = slotBuckets.get(slot);
    if (slotB) {
      slotB.total++;
      if (isInterview) slotB.interviews++;
    }

    // Grid
    const key = `${day}-${slot}`;
    const cell = gridMap.get(key);
    if (cell) {
      cell.total++;
      if (isInterview) cell.interviews++;
    }
  }

  const dayStats: DayTimingStat[] = orderedDays.map((d) => {
    const b = dayBuckets.get(d) ?? { total: 0, interviews: 0, responded: 0 };
    return {
      dayIndex: d,
      dayName: DAY_NAMES[d],
      totalApplications: b.total,
      interviewCount: b.interviews,
      interviewRate: b.total > 0 ? Math.round((b.interviews / b.total) * 100) : 0,
      respondedCount: b.responded,
      responseRate: b.total > 0 ? Math.round((b.responded / b.total) * 100) : 0,
    };
  });

  const slotStats: SlotTimingStat[] = (
    ["MORNING", "MIDDAY", "AFTERNOON", "EVENING"] as TimeSlot[]
  ).map((slot) => {
    const b = slotBuckets.get(slot) ?? { total: 0, interviews: 0 };
    return {
      slot,
      ...TIME_SLOT_CONFIG[slot],
      totalApplications: b.total,
      interviewCount: b.interviews,
      interviewRate: b.total > 0 ? Math.round((b.interviews / b.total) * 100) : 0,
    };
  });

  const heatmapGrid: HeatmapCell[] = [];
  for (const d of orderedDays) {
    for (const slot of ["MORNING", "MIDDAY", "AFTERNOON", "EVENING"] as TimeSlot[]) {
      const cell = gridMap.get(`${d}-${slot}`) ?? { total: 0, interviews: 0 };
      heatmapGrid.push({
        dayIndex: d,
        dayName: DAY_NAMES[d],
        slot,
        total: cell.total,
        interviews: cell.interviews,
      });
    }
  }

  // Finde besten Tag und besten Slot (mit mindestens 1 Bewerbung)
  const daysWithData = dayStats.filter((d) => d.totalApplications > 0);
  daysWithData.sort((a, b) => b.interviewRate - a.interviewRate || b.totalApplications - a.totalApplications);
  const bestDay = daysWithData.length > 0 ? daysWithData[0].dayName : null;

  const slotsWithData = slotStats.filter((s) => s.totalApplications > 0);
  slotsWithData.sort((a, b) => b.interviewRate - a.interviewRate || b.totalApplications - a.totalApplications);
  const bestSlot = slotsWithData.length > 0 ? `${slotsWithData[0].label} (${slotsWithData[0].hours})` : null;

  let recommendation = "Bewerbungen dienstags und mittwochs zwischen 08:00 und 11:00 Uhr erzielen statistisch die höchsten Öffnungs- und Einladungsquoten.";
  if (bestDay && bestSlot) {
    recommendation = `In deiner Historie performt der ${bestDay} im Zeitfenster ${bestSlot} am stärksten. Plane wichtige Bewerbungsabsendungen bevorzugt hier ein.`;
  }

  return {
    totalAnalyzed,
    dayStats,
    slotStats,
    heatmapGrid,
    bestDay,
    bestSlot,
    recommendation,
  };
}
