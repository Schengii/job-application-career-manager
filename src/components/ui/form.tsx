// -----------------------------------------------------------------------------
// Formular-Primitiven: Label, Input, Textarea, Select, Field
// -----------------------------------------------------------------------------
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-foreground", className)} {...props} />;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, id, ...props }: InputProps) {
  if (label) {
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-foreground">
          {label}
        </label>
        <input id={id} className={cn(fieldClasses, className)} {...props} />
      </div>
    );
  }
  return <input id={id} className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClasses, "min-h-24 resize-y", className)} {...props} />;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: readonly { value: string; label: string }[] | { value: string; label: string }[];
}

export function Select({ className, label, options, children, id, ...props }: SelectProps) {
  const selectElement = (
    <select id={id} className={cn(fieldClasses, "cursor-pointer", className)} {...props}>
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))
        : children}
    </select>
  );

  if (label) {
    return (
      <div>
        <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-foreground">
          {label}
        </label>
        {selectElement}
      </div>
    );
  }

  return selectElement;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  required,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-danger"> *</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
