"use client";

// -----------------------------------------------------------------------------
// Modal-Dialog auf Basis des nativen <dialog>-Elements: liefert kostenlos
// Fokus-Falle, ESC-zum-Schließen und einen zugänglichen Backdrop (::backdrop).
// -----------------------------------------------------------------------------
import { useEffect, useRef, createContext, useContext } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

const DialogContext = createContext<{ onClose?: () => void }>({});

export function Dialog({
  open,
  onClose,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const handleClose = onClose || (() => onOpenChange?.(false));

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <DialogContext.Provider value={{ onClose: handleClose }}>
      <dialog
        ref={ref}
        onClose={handleClose}
        onCancel={handleClose}
        onClick={(e) => {
          if (e.target === ref.current) handleClose();
        }}
        className={cn(
          "m-auto max-h-[85vh] w-[min(720px,94vw)] overflow-y-auto rounded-2xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-sm",
          className,
        )}
      >
        {title ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <Button type="button" variant="ghost" size="icon" onClick={handleClose} aria-label="Schließen">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-5">{children}</div>
          </>
        ) : (
          children
        )}
      </dialog>
    </DialogContext.Provider>
  );
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { onClose } = useContext(DialogContext);
  return (
    <div className={cn("p-5 relative", className)}>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("flex flex-col space-y-1.5 text-left pb-3", className)}>{children}</div>;
}

export function DialogTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={cn("text-base font-semibold text-foreground", className)}>{children}</h2>;
}
