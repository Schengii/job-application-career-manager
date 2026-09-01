"use client";

// -----------------------------------------------------------------------------
// In-App Benachrichtigungs-Zentrale (Notification Bell)
// -----------------------------------------------------------------------------
import { useState, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Bell, AlertCircle, Calendar, MailQuestion, Check, X, XCircle, PartyPopper, Users, Sparkles } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { ApplicationListItem, EmailSuggestionWithApplication } from "@/types";
import { getNotificationsFromApplications, getEmailSuggestionNotifications } from "@/lib/notifications";
import { useDismissedNotifications } from "@/lib/useDismissedNotifications";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { data: applications } = useSWR<ApplicationListItem[]>("/api/applications", fetcher);
  // Offene, per E-Mail-Sync erkannte Status-Vorschläge (s. /inbox) — werden
  // unten als eigener Notification-Typ ("EMAIL_SUGGESTION") eingeblendet, der
  // (anders als die übrigen Typen) auf /inbox statt auf die Bewerbung verlinkt.
  const { data: pendingSuggestions } = useSWR<EmailSuggestionWithApplication[]>(
    "/api/email-sync/pending",
    fetcher
  );
  const [open, setOpen] = useState(false);
  const { dismissedIds, dismiss, dismissMany } = useDismissedNotifications();
  const popoverRef = useRef<HTMLDivElement>(null);

  const notifications = useMemo(() => {
    const fromApplications = applications ? getNotificationsFromApplications(applications, dismissedIds) : [];
    const fromEmailSuggestions = pendingSuggestions
      ? getEmailSuggestionNotifications(pendingSuggestions, dismissedIds)
      : [];
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    return [...fromEmailSuggestions, ...fromApplications].sort(
      (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
    );
  }, [applications, pendingSuggestions, dismissedIds]);

  // Click-Outside Listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  function handleDismiss(id: string) {
    dismiss(id);
  }

  function handleDismissAll() {
    dismissMany(notifications.map((n) => n.id));
    setOpen(false);
  }

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
        aria-label="Benachrichtigungen"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse-subtle">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-xl border border-border bg-surface shadow-2xl animate-scale-in glass-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface-hover/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground uppercase tracking-wider">
                Benachrichtigungen
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} aktiv
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleDismissAll}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Check className="h-3 w-3" /> Alle gelesen
              </button>
            )}
          </div>

          <div className="scroll-thin max-h-80 overflow-y-auto divide-y divide-border">
            {notifications.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">
                <Check className="h-6 w-6 text-emerald-500 mx-auto mb-2 opacity-80" />
                Alles erledigt! Aktuell keine offenen Fristen, Termine oder neuen Rückmeldungen.
              </div>
            )}

            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3.5 flex items-start gap-3 hover:bg-surface-hover/60 transition-colors group relative",
                  notif.type === "OVERDUE" && "border-l-4 border-l-rose-500 bg-rose-500/5",
                  notif.type === "DUE_SOON" && "border-l-4 border-l-sky-500 bg-sky-500/5",
                  notif.type === "FOLLOW_UP" && "border-l-4 border-l-orange-500 bg-orange-500/5",
                  notif.type === "REJECTED" && "border-l-4 border-l-slate-400 bg-slate-400/5",
                  notif.type === "OFFER" && "border-l-4 border-l-emerald-500 bg-emerald-500/5",
                  notif.type === "INTERVIEW" && "border-l-4 border-l-violet-500 bg-violet-500/5",
                  notif.type === "EMAIL_SUGGESTION" && "border-l-4 border-l-primary bg-primary-soft/40"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {notif.type === "OVERDUE" && <AlertCircle className="h-4 w-4 text-rose-500" />}
                  {notif.type === "DUE_SOON" && <Calendar className="h-4 w-4 text-sky-500" />}
                  {notif.type === "FOLLOW_UP" && <MailQuestion className="h-4 w-4 text-orange-500" />}
                  {notif.type === "REJECTED" && <XCircle className="h-4 w-4 text-slate-400" />}
                  {notif.type === "OFFER" && <PartyPopper className="h-4 w-4 text-emerald-500" />}
                  {notif.type === "INTERVIEW" && <Users className="h-4 w-4 text-violet-500" />}
                  {notif.type === "EMAIL_SUGGESTION" && <Sparkles className="h-4 w-4 text-primary" />}
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={notif.type === "EMAIL_SUGGESTION" ? "/inbox" : `/applications/${notif.applicationId}`}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">{notif.companyName}</p>
                      <span className="text-[10px] text-muted-foreground">{notif.title}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">{notif.position}</p>
                    <p className="text-[11px] font-medium text-foreground/80 mt-1">{notif.message}</p>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => handleDismiss(notif.id)}
                  className="shrink-0 p-1 text-muted-foreground hover:text-foreground rounded"
                  title="Ausblenden"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
