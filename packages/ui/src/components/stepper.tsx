import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface StepperStep {
  title: ReactNode;
  description?: ReactNode;
  state?: "complete" | "current" | "upcoming";
  optional?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepChange?: (index: number) => void;
  className?: string;
}

export function Stepper({ steps, currentStep, onStepChange, className }: StepperProps) {
  return (
    <ol
      style={{
        padding: designTokens.spacing[4],
        gap: designTokens.spacing[4],
        borderRadius: designTokens.borderRadius.lg,
        border: `${designTokens.borderWidth.default} solid ${designTokens.colors.border.default}`,
        backgroundColor: "white",
        boxShadow: designTokens.shadow.base,
      }}
      className={cn(
        "relative flex flex-col gap-4 rounded-xl border bg-white p-4 text-neutral-900 shadow-sm sm:flex-row sm:items-stretch",
        className
      )}
      role="list"
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const state =
          step.state ??
          (index < currentStep ? "complete" : index === currentStep ? "current" : "upcoming");
        const isClickable = typeof onStepChange === "function" && index <= currentStep;

        return (
          <li
            key={index}
            style={{
              padding: designTokens.spacing[3],
              gap: designTokens.spacing[3],
              borderRadius: designTokens.borderRadius.xl,
            }}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-2xl border border-transparent p-3 transition",
              state === "current" && "border-neutral-300 bg-atlas-blue/10 shadow-sm",
              state === "complete" && "border-success/30 bg-success/10 text-success-dark",
              state === "upcoming" && "border-dashed border-neutral-300 text-neutral-500"
            )}
          >
            <button
              type="button"
              onClick={isClickable ? () => onStepChange(index) : undefined}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition",
                state === "complete"
                  ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                  : state === "current"
                    ? "border-white/30 bg-white/20 text-neutral-0"
                    : "border-white/10 text-neutral-3",
                isClickable
                  ? "cursor-pointer hover:border-white/40 hover:text-neutral-0"
                  : "cursor-default"
              )}
              aria-current={state === "current" ? "step" : undefined}
              aria-disabled={isClickable ? undefined : true}
            >
              {state === "complete" ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
              <span className="sr-only">Step {index + 1}</span>
            </button>
            <div className="flex-1 space-y-1 text-left">
              <p className="text-sm font-semibold leading-snug">{step.title}</p>
              {step.description ? (
                <p className="text-xs text-neutral-3">{step.description}</p>
              ) : null}
              {step.optional ? (
                <p className="text-[11px] uppercase tracking-[0.35em] text-neutral-3">Optional</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
