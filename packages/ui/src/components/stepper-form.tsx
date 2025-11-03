import type { ReactNode } from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "../utils/cn";

export interface StepConfig {
  id: string;
  title: string;
  description?: string;
}

export interface StepperFormProps {
  steps: StepConfig[];
  currentStep: number;
  onStepChange?: (step: number) => void;
  children: ReactNode;
  className?: string;
  allowSkipToCompleted?: boolean;
}

/**
 * StepperForm - A multi-step form component with visual progress indicator
 *
 * Features:
 * - Visual step indicator at the top
 * - Current step highlighting
 * - Completed steps marked with checkmarks
 * - Optional navigation to completed steps
 * - Responsive layout
 * - Accessible with proper ARIA attributes
 */
export function StepperForm({
  steps,
  currentStep,
  onStepChange,
  children,
  className,
  allowSkipToCompleted = false,
}: StepperFormProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {/* Stepper */}
      <nav aria-label="Form progress" className="overflow-x-auto">
        <ol className="flex items-center gap-2 min-w-max">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;
            const isClickable = allowSkipToCompleted && isCompleted && onStepChange;

            return (
              <li key={step.id} className="flex items-center gap-2">
                <button
                  onClick={() => isClickable && onStepChange(stepNumber)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                    isCurrent && "bg-atlas-blue/10 ring-2 ring-atlas-blue/30",
                    isCompleted && !isCurrent && "bg-white/5 hover:bg-white/10",
                    isUpcoming && "bg-white/5 opacity-60",
                    isClickable && "cursor-pointer"
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {/* Step indicator */}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                      isCurrent && "bg-atlas-blue text-white",
                      isCompleted && "bg-green-500 text-white",
                      isUpcoming && "bg-white/10 text-neutral-400"
                    )}
                  >
                    {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
                  </div>

                  {/* Step content */}
                  <div className="text-left">
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isCurrent && "text-atlas-blue",
                        isCompleted && "text-neutral-200",
                        isUpcoming && "text-neutral-400"
                      )}
                    >
                      {step.title}
                    </div>
                    {step.description && (
                      <div className="text-xs text-neutral-400">{step.description}</div>
                    )}
                  </div>
                </button>

                {/* Connector */}
                {index < steps.length - 1 && <ChevronRight className="h-5 w-5 text-neutral-600" />}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

export interface StepperFormActionsProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
  backLabel?: string;
  submitLabel?: string;
  className?: string;
}

/**
 * StepperFormActions - Action buttons for stepper forms
 *
 * Features:
 * - Back/Next/Submit buttons
 * - Automatic hiding of back button on first step
 * - Submit button on last step
 * - Loading states
 * - Customizable labels
 */
export function StepperFormActions({
  onBack,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  isNextDisabled,
  isSubmitting,
  nextLabel = "Next",
  backLabel = "Back",
  submitLabel = "Submit",
  className,
}: StepperFormActionsProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 pt-6", className)}>
      {!isFirstStep && onBack ? (
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-neutral-0 transition-colors hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {backLabel}
        </button>
      ) : (
        <div />
      )}

      {isLastStep && onSubmit ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="rounded-xl bg-atlas-blue px-6 py-3 text-sm font-semibold text-white shadow-atlas transition-all hover:bg-atlas-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      ) : (
        onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isSubmitting}
            className="rounded-xl bg-atlas-blue px-6 py-3 text-sm font-semibold text-white shadow-atlas transition-all hover:bg-atlas-blue-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel}
          </button>
        )
      )}
    </div>
  );
}
