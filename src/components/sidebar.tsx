"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Calendar, Building2, Search, Settings, Menu, X, BarChart3, GraduationCap, FileText, FileSpreadsheet, Keyboard, Inbox } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/core/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Bewerbungen", icon: Briefcase },
  { href: "/calendar", label: "Kalender", icon: Calendar },
  { href: "/inbox", label: "Antworten-Inbox", icon: Inbox },
  { href: "/excel-view", label: "Excel-Tabelle", icon: FileSpreadsheet },
  { href: "/companies", label: "Unternehmen", icon: Building2 },
  { href: "/jobs", label: "Jobsuche", icon: Search },
  { href: "/interview-prep", label: "Interview-Prep", icon: GraduationCap },
  { href: "/cv-designer", label: "CV-Designer", icon: FileText },
  { href: "/analytics", label: "Auswertungen", icon: BarChart3 },
  { href: "/settings", label: "Einstellungen", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Hauptnavigation">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary-soft text-primary font-semibold"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Topbar */}
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <span className="text-base font-semibold">Career Manager</span>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Menü öffnen"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface py-4">
            <div className="flex items-center justify-between px-4 pb-4">
              <span className="text-base font-semibold">Career Manager</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Menü schließen"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  window.dispatchEvent(new Event("open-command-palette"));
                }}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
              >
                <Search className="h-4 w-4 shrink-0" aria-hidden />
                <span>Suchen …</span>
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface py-5 md:flex">
        <div className="flex items-center justify-between px-4 pb-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-xs">
              JM
            </span>
            <span className="text-base font-semibold leading-tight">
              Career
              <br />
              Manager
            </span>
          </Link>
          <NotificationBell />
        </div>
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1 text-left">Suchen …</span>
            <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
          </button>
        </div>
        <NavLinks />
        <div className="flex items-center justify-between border-t border-border px-4 pt-4">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }));
            }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            title="Tastaturkürzel anzeigen (?)"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Kürzel <kbd className="rounded border border-border px-1 py-0.2 font-mono text-[10px]">?</kbd></span>
          </button>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}
