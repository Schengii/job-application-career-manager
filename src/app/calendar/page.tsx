"use client";

import { useState } from "react";
import useSWR from "swr";
import { Calendar as CalendarIcon, Download, Sparkles } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem } from "@/types";
import { InteractiveCalendar } from "@/components/calendar/interactive-calendar";
import { CalendarFeedModal } from "@/components/calendar/calendar-feed-modal";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const { data: applications, isLoading } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  const [feedModalOpen, setFeedModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Interview- & Termin-Kalender</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle anstehenden Vorstellungsgespräche, Coding-Challenge Abgaben und Wiedervorlagen im Überblick.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setFeedModalOpen(true)}
            className="card-hover-effect"
          >
            <CalendarIcon className="h-4 w-4 mr-1.5 text-sky-500" />
            Kalender abonnieren (.ics)
          </Button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Lade Termine …</p>
      ) : (
        <InteractiveCalendar applications={applications ?? []} />
      )}

      <CalendarFeedModal open={feedModalOpen} onClose={() => setFeedModalOpen(false)} />
    </div>
  );
}
