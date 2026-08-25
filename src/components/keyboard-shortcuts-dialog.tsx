"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Keyboard, X } from "lucide-react";

type ShortcutGroup = {
  category: string;
  items: { key: string; description: string }[];
};

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: "Navigation (G + Taste)",
    items: [
      { key: "G D", description: "Zum Dashboard" },
      { key: "G A", description: "Zu den Bewerbungen" },
      { key: "G E", description: "Zur Excel-Tabelle" },
      { key: "G C", description: "Zu den Unternehmen" },
      { key: "G J", description: "Zur Jobsuche & Portal-Sync" },
      { key: "G I", description: "Zum Interview-Prep Leitfaden" },
      { key: "G V", description: "Zum CV-Designer (Lebenslauf)" },
      { key: "G S", description: "Zu den Einstellungen" },
    ],
  },
  {
    category: "Aktionen",
    items: [
      { key: "⌘K / Strg+K", description: "Globale Suche (Command Palette) öffnen" },
      { key: "/", description: "Schnellsuche starten" },
      { key: "N", description: "Neue Bewerbung anlegen" },
      { key: "?", description: "Dieses Tastatur-Hilfefenster öffnen" },
      { key: "Esc", description: "Modale / Dialoge schließen" },
    ],
  },
];

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);
  const [keySequence, setKeySequence] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    function handleKeyDown(e: KeyboardEvent) {
      // Ignoriere Tastaturkürzel, wenn der Nutzer gerade in einem Textfeld tippt
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape" && open) {
        setOpen(false);
        return;
      }

      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        window.dispatchEvent(new Event("open-command-palette"));
        return;
      }

      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey && !open) {
        e.preventDefault();
        window.dispatchEvent(new Event("open-new-application-dialog"));
        return;
      }

      // Sequenzen für 'G' + Taste
      if (e.key.toLowerCase() === "g") {
        setKeySequence("g");
        clearTimeout(timeout);
        timeout = setTimeout(() => setKeySequence(""), 1200);
        return;
      }

      if (keySequence === "g") {
        const next = e.key.toLowerCase();
        setKeySequence("");
        clearTimeout(timeout);

        if (next === "d") router.push("/");
        else if (next === "a") router.push("/applications");
        else if (next === "e") router.push("/excel-view");
        else if (next === "c") router.push("/companies");
        else if (next === "j") router.push("/jobs");
        else if (next === "i") router.push("/interview-prep");
        else if (next === "v") router.push("/cv-designer");
        else if (next === "s") router.push("/settings");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [keySequence, open, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tastaturkürzel"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Keyboard className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Tastaturkürzel</h2>
              <p className="text-xs text-muted-foreground">Blitzschnelle Navigation im Career Manager</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5">
                {group.category}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-hover/40 px-3 py-2 text-xs"
                  >
                    <span className="text-foreground font-medium">{item.description}</span>
                    <kbd className="rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-bold text-primary shadow-2xs">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border bg-surface-hover/30 px-5 py-3 text-right">
          <span className="text-xs text-muted-foreground">
            Drücke jederzeit <kbd className="rounded border border-border px-1 py-0.5 font-mono">?</kbd> für diese Übersicht.
          </span>
        </div>
      </div>
    </div>
  );
}
