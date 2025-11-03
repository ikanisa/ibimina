import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "../utils/cn";

export interface ReviewStepProps {
  title?: string;
  sections: ReviewSection[];
  className?: string;
}

export interface ReviewSection {
  title: string;
  items: ReviewItem[];
  onEdit?: () => void;
}

export interface ReviewItem {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}

/**
 * ReviewStep - A component for displaying a review/confirmation step
 *
 * Features:
 * - Organized sections
 * - Edit buttons for each section
 * - Highlighted important fields
 * - Clean, scannable layout
 * - Consistent with design tokens
 */
export function ReviewStep({ title, sections, className }: ReviewStepProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {title && (
        <div className="flex items-center gap-3 text-green-400">
          <CheckCircle2 className="h-6 w-6" />
          <h3 className="text-lg font-semibold text-neutral-0">{title}</h3>
        </div>
      )}

      <div className="space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h4 className="text-base font-semibold text-neutral-0">{section.title}</h4>
              {section.onEdit && (
                <button
                  onClick={section.onEdit}
                  className="text-sm text-atlas-blue hover:text-atlas-blue-light transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            <dl className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className={cn(
                    "flex flex-col gap-1 sm:flex-row sm:justify-between",
                    item.highlight && "rounded-lg bg-atlas-glow p-2 -mx-2"
                  )}
                >
                  <dt className="text-sm text-neutral-400">{item.label}</dt>
                  <dd
                    className={cn(
                      "text-sm font-medium",
                      item.highlight ? "text-atlas-blue" : "text-neutral-0"
                    )}
                  >
                    {item.value || <span className="text-neutral-500">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
