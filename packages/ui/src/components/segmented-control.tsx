"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { useId } from "react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

type SegmentedValue = string | number;

export interface SegmentedOption {
  value: SegmentedValue;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

interface SegmentedControlProps
  extends Pick<HTMLAttributes<HTMLDivElement>, "aria-label" | "aria-labelledby"> {
  name?: string;
  value: SegmentedValue;
  onValueChange: (value: SegmentedValue) => void;
  options: SegmentedOption[];
  className?: string;
  columns?: 1 | 2 | 3;
}

export function SegmentedControl({
  name,
  value,
  onValueChange,
  options,
  className,
  columns = 1,
  ...aria
}: SegmentedControlProps) {
  const fallbackName = useId();
  const fieldName = name ?? fallbackName;

  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-3",
        className
      )}
      style={{
        gap: designTokens.spacing[2],
      }}
      {...aria}
    >
      {options.map((option) => {
        const id = `${fieldName}-${String(option.value)}`;
        const selected = option.value === value;
        return (
          <label
            key={id}
            htmlFor={id}
            style={{
              padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
              borderRadius: designTokens.borderRadius.xl,
              borderWidth: designTokens.borderWidth.default,
              minHeight: designTokens.size.touchTarget.comfortable,
            }}
            className={cn(
              "flex cursor-pointer flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition",
              selected
                ? "border-atlas-blue bg-atlas-blue/10 text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              id={id}
              type="radio"
              className="sr-only"
              name={fieldName}
              value={String(option.value)}
              checked={selected}
              onChange={() => onValueChange(option.value)}
              disabled={option.disabled}
            />
            <span
              className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide"
              style={{
                fontSize: designTokens.typography.fontSize.xs,
                fontWeight: designTokens.typography.fontWeight.medium,
                color: selected ? designTokens.colors.brand.primary : designTokens.colors.text.primary,
              }}
            >
              {option.icon && <span aria-hidden>{option.icon}</span>}
              <span>{option.label}</span>
            </span>
            {option.description ? (
              <span
                className="text-xs"
                style={{
                  fontSize: designTokens.typography.fontSize.xs,
                  color: designTokens.colors.text.secondary,
                }}
              >
                {option.description}
              </span>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
