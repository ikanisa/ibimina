"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "../utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, className, ...props },
  ref
) {
  return (
    <label className="flex flex-col gap-2 text-sm text-neutral-0">
      {label && <span className="text-xs uppercase tracking-[0.3em] text-neutral-2">{label}</span>}
      <input
        {...props}
        ref={ref}
        className={cn(
          "rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-neutral-0 placeholder:text-neutral-2 focus:outline-none focus:ring-2 focus:ring-rw-blue",
          className
        )}
      />
      {helperText && <span className="text-[11px] text-neutral-2">{helperText}</span>}
    </label>
  );
});
