import type { ReactNode } from "react";
import { Smile } from "lucide-react";

import { cn } from "../utils/cn";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, className, action }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-white/5 p-8 text-center text-sm text-neutral-2",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-neutral-0 shadow-glass">
        {icon ?? <Smile className="h-6 w-6" />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-neutral-0">{title}</h3>
        {description && <p className="mt-1 text-xs text-neutral-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}
