import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, ShieldAlert } from "lucide-react";

import { cn } from "../utils/cn";

export type FormLayoutVariant = "single" | "double";

export interface FormLayoutProps {
  variant?: FormLayoutVariant;
  className?: string;
  children: ReactNode;
  gap?: string;
}

export function FormLayout({
  variant = "single",
  className,
  children,
  gap = "gap-6",
}: FormLayoutProps) {
  return (
    <div
      className={cn(
        "grid",
        variant === "single" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        gap,
        className
      )}
    >
      {children}
    </div>
  );
}

export interface FormFieldProps {
  label: ReactNode;
  description?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  inputId?: string;
  required?: boolean;
  optionalLabel?: ReactNode;
  actions?: ReactNode;
  children: ReactNode | ((props: { id?: string; describedBy?: string }) => ReactNode);
  className?: string;
}

export function FormField({
  label,
  description,
  hint,
  error,
  inputId,
  required,
  optionalLabel,
  actions,
  children,
  className,
}: FormFieldProps) {
  const helperId = inputId ? `${inputId}-description` : undefined;
  const errorId = inputId ? `${inputId}-error` : undefined;

  const describedBy =
    [helperId, error ? errorId : undefined].filter(Boolean).join(" ") || undefined;

  const control =
    typeof children === "function" ? children({ id: inputId, describedBy }) : children;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={typeof inputId === "string" ? inputId : undefined}
          className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-2"
        >
          {label}
          {required ? <span className="ml-2 text-[11px] text-rose-200">*</span> : null}
          {!required && optionalLabel ? (
            <span className="ml-2 text-[11px] text-neutral-3">{optionalLabel}</span>
          ) : null}
        </label>
        {actions ? (
          <div className="text-xs uppercase tracking-[0.3em] text-neutral-3">{actions}</div>
        ) : null}
      </div>

      {description ? (
        <p id={helperId} className="text-xs text-neutral-3">
          {description}
        </p>
      ) : null}

      <div aria-describedby={describedBy}>{control}</div>

      {hint ? <p className="text-[11px] text-neutral-3">{hint}</p> : null}

      {error ? (
        <p id={errorId} role="alert" className="flex items-start gap-2 text-xs text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

export type FormSummaryStatus = "error" | "warning" | "info" | "success";

const SUMMARY_STYLES: Record<
  FormSummaryStatus,
  { container: string; icon: ReactNode; accent: string }
> = {
  error: {
    container: "border-red-500/40 bg-red-500/10 text-red-100",
    icon: <ShieldAlert className="h-5 w-5" aria-hidden />,
    accent: "text-red-200",
  },
  warning: {
    container: "border-amber-500/40 bg-amber-500/10 text-amber-50",
    icon: <AlertCircle className="h-5 w-5" aria-hidden />,
    accent: "text-amber-100",
  },
  info: {
    container: "border-sky-500/40 bg-sky-500/10 text-sky-50",
    icon: <Info className="h-5 w-5" aria-hidden />,
    accent: "text-sky-100",
  },
  success: {
    container: "border-emerald-500/40 bg-emerald-500/10 text-emerald-50",
    icon: <CheckCircle2 className="h-5 w-5" aria-hidden />,
    accent: "text-emerald-100",
  },
};

export interface FormSummaryBannerProps {
  title: ReactNode;
  description?: ReactNode;
  status?: FormSummaryStatus;
  actions?: ReactNode;
  items?: ReactNode[];
  className?: string;
}

export function FormSummaryBanner({
  title,
  description,
  status = "info",
  actions,
  items,
  className,
}: FormSummaryBannerProps) {
  const tone = SUMMARY_STYLES[status];

  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-[calc(var(--radius-xl)_*_1.1)] border p-4 text-sm shadow-[0_0_0_1px_rgba(255,255,255,0.05)]",
        tone.container,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10">
          {tone.icon}
        </span>
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          {description ? <p className="text-xs text-white/80">{description}</p> : null}
        </div>
        {actions ? <div className="text-xs uppercase tracking-[0.3em]">{actions}</div> : null}
      </div>
      {items && items.length > 0 ? (
        <ul className={cn("list-disc space-y-1 pl-6 text-xs", tone.accent)}>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
