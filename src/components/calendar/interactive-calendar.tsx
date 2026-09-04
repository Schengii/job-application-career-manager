"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Video,
  Clock,
  ExternalLink,
  List,
  LayoutGrid,
} from "lucide-react";
import type { ApplicationListItem } from "@/types";
import { formatDate, cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CalendarEvent = {
  id: string;
  applicationId: string;
  date: Date;
  dateStr: string; // YYYY-MM-DD
  title: string;
  companyName: string;
  position: string;
  type: "INTERVIEW" | "CODING_CHALLENGE" | "FOLLOW_UP" | "OTHER";
  meetingUrl?: string | null;
  status: string;
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function getEventType(app: ApplicationListItem): "INTERVIEW" | "CODING_CHALLENGE" | "FOLLOW_UP" | "OTHER" {
  const step = (app.nextStep || "").toLowerCase();
  if (app.interviewStage === "CODING_CHALLENGE" || step.includes("challenge") || step.includes("aufgabe")) {
    return "CODING_CHALLENGE";
  }
  if (app.status === "INTERVIEW" || step.includes("gespräch") || step.includes("interview") || step.includes("screening")) {
    return "INTERVIEW";
  }
  if (step.includes("nachfassen") || step.includes("rückmeldung") || step.includes("wiedervorlage")) {
    return "FOLLOW_UP";
  }
  return "OTHER";
}

function getEventStyle(type: CalendarEvent["type"]) {
  switch (type) {
    case "INTERVIEW":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25";
    case "CODING_CHALLENGE":
      return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 hover:bg-purple-500/25";
    case "FOLLOW_UP":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25";
    default:
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 hover:bg-sky-500/25";
  }
}

export function InteractiveCalendar({ applications }: { applications: ApplicationListItem[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"MONTH" | "AGENDA">("MONTH");

  // Alle Events aus den Anwendungen mit nextStepDate extrahieren
  const events = useMemo(() => {
    const list: CalendarEvent[] = [];
    for (const app of applications) {
      if (app.nextStepDate) {
        const d = new Date(app.nextStepDate);
        if (!isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${day}`;

          list.push({
            id: `${app.id}-${dateStr}`,
            applicationId: app.id,
            date: d,
            dateStr,
            title: app.nextStep || "Anstehender Schritt",
            companyName: app.company.name,
            position: app.position,
            type: getEventType(app),
            meetingUrl: app.meetingUrl,
            status: app.status,
          });
        }
      }
    }
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [applications]);

  // Event Map für schnelle Tageszuordnung im Grid: dateStr -> events[]
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const existing = map.get(ev.dateStr) || [];
      existing.push(ev);
      map.set(ev.dateStr, existing);
    }
    return map;
  }, [events]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Tage des aktuellen Monats ermitteln
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Wochentag des 1. Tages (0 = So, 1 = Mo, ... 6 = Sa) -> Mo-basiert
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6; // Sonntag ist Tag 6 in Mo..So

    const daysCount = lastDayOfMonth.getDate();
    const days: { dayNumber: number; dateStr: string; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Vorheriger Monat Puffer
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false, isToday: false });
    }

    // Aktueller Monat
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    for (let d = 1; d <= daysCount; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Nächster Monat Puffer bis 35 bzw. 42 Felder
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ dayNumber: d, dateStr, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function goToToday() {
    setCurrentDate(new Date());
  }

  const monthLabel = currentDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  // Kommende Termine für die Agenda-Ansicht
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events.filter((e) => e.date >= now);
  }, [events]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={prevMonth} className="h-8 w-8 p-0" title="Vorheriger Monat">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={nextMonth} className="h-8 w-8 p-0" title="Nächster Monat">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={goToToday} className="h-8 text-xs font-semibold">
            Heute
          </Button>
          <CardTitle className="text-lg font-bold text-foreground capitalize">{monthLabel}</CardTitle>
        </div>

        <div className="flex items-center gap-2">
          {/* Legende */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground mr-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Vorstellungsgespräch
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Coding Challenge
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Nachfassen / Wiedervorlage
            </span>
          </div>

          <div className="flex items-center rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("MONTH")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                viewMode === "MONTH" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Monat
            </button>
            <button
              type="button"
              onClick={() => setViewMode("AGENDA")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                viewMode === "AGENDA" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" /> Agenda ({upcomingEvents.length})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {viewMode === "MONTH" ? (
          <div className="flex flex-col">
            {/* Wochentags-Kopf */}
            <div className="grid grid-cols-7 border-b border-border bg-surface-hover/60 text-center text-xs font-semibold text-muted-foreground py-2">
              {WEEKDAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Kalender-Tage Grid */}
            <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60">
              {calendarDays.map((calDay, idx) => {
                const dayEvents = eventMap.get(calDay.dateStr) || [];
                return (
                  <div
                    key={`${calDay.dateStr}-${idx}`}
                    className={cn(
                      "min-h-[105px] p-1.5 transition-colors flex flex-col",
                      !calDay.isCurrentMonth && "bg-surface-hover/20 text-muted-foreground/50",
                      calDay.isToday && "bg-primary/5 font-semibold"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          calDay.isToday
                            ? "bg-primary text-white font-bold"
                            : calDay.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/50"
                        )}
                      >
                        {calDay.dayNumber}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-primary px-1">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] scroll-thin">
                      {dayEvents.map((ev) => (
                        <Link
                          key={ev.id}
                          href={`/applications/${ev.applicationId}`}
                          className={cn(
                            "group block rounded border px-1.5 py-0.5 text-[11px] transition-all hover:scale-[1.01]",
                            getEventStyle(ev.type)
                          )}
                          title={`${ev.companyName} – ${ev.title}`}
                        >
                          <div className="font-semibold truncate leading-tight flex items-center justify-between">
                            <span className="truncate">{ev.companyName}</span>
                            {ev.meetingUrl && <Video className="h-2.5 w-2.5 shrink-0 opacity-75" />}
                          </div>
                          <div className="truncate text-[10px] opacity-80 leading-tight">
                            {ev.title}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Agenda-Ansicht */
          <div className="p-4 space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-medium text-foreground">Keine anstehenden Termine gefunden</p>
                <p className="text-xs mt-1">
                  Trage in deinen Bewerbungen unter <em>„Nächster Schritt & Datum“</em> anstehende Gespräche ein.
                </p>
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3.5 hover:bg-surface-hover/50 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface-hover/80 h-12 w-12 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {ev.date.toLocaleDateString("de-DE", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-foreground leading-none">
                        {ev.date.getDate()}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/applications/${ev.applicationId}`}
                          className="font-semibold text-foreground text-sm hover:underline truncate"
                        >
                          {ev.companyName}
                        </Link>
                        <span className={cn("rounded-full border px-2 py-0.2 text-[10px] font-semibold", getEventStyle(ev.type))}>
                          {ev.type === "INTERVIEW" ? "Interview" : ev.type === "CODING_CHALLENGE" ? "Challenge" : "Wiedervorlage"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ev.position}</p>
                      <p className="text-xs font-medium text-primary mt-1 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {ev.title} ({formatDate(ev.date)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {ev.meetingUrl && (
                      <a
                        href={ev.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft px-3 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Meeting beitreten</span>
                      </a>
                    )}
                    <Link href={`/applications/${ev.applicationId}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Details <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
