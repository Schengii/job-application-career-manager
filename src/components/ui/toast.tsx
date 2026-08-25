"use client";

// -----------------------------------------------------------------------------
// Toast-/Benachrichtigungs-Context
// -----------------------------------------------------------------------------
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";
type Toast = { id: number; message: string; variant: ToastVariant };
type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const value: ToastContextValue = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    info: (message) => push(message, "info"),
    warning: (message) => push(message, "warning"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg",
              t.variant === "success" && "border-success/30 bg-success-soft text-success",
              t.variant === "error" && "border-danger/30 bg-danger-soft text-danger",
              t.variant === "info" && "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400",
              t.variant === "warning" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {t.variant === "success" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {t.variant === "error" && <AlertCircle className="h-4 w-4 shrink-0" />}
            {t.variant === "info" && <Info className="h-4 w-4 shrink-0 text-sky-500" />}
            {t.variant === "warning" && <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />}
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Benachrichtigung schließen"
              className="ml-2"
            >
              <X className="h-3.5 w-3.5 opacity-60" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
    };
  }
  return ctx;
}
