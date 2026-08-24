"use client";

// -----------------------------------------------------------------------------
// Modal-Dialog auf Basis des nativen <dialog>-Elements: liefert kostenlos
// Fokus-Falle, ESC-zum-Schließen und einen zugänglichen Backdrop (::backdrop).
// -----------------------------------------------------------------------------
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[85vh] w-[min(640px,92vw)] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Schließen">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
