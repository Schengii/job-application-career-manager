"use client";

// -----------------------------------------------------------------------------
// Umschalter für Light/Dark Mode. Rendert erst nach dem Mount echten Zustand,
// um Hydration-Mismatches (Server kennt Theme nicht) zu vermeiden.
// -----------------------------------------------------------------------------
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Es gibt keine Alternative zu einem Effekt, um "nach der Hydration" zu erkennen:
  // Server und erster Client-Render kennen das Theme nicht, daher wird bewusst erst
  // nach dem Mount umgeschaltet, um einen Hydration-Mismatch zu vermeiden.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
