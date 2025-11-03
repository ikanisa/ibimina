import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, actions, className }: SectionHeaderProps) {
  return (
    <header className={cn("space-y-1", className)} style={{ gap: designTokens.spacing[1] }}>
      <div className="flex items-center justify-between gap-4" style={{ gap: designTokens.spacing[4] }}>
        <h3
          className="text-lg font-semibold"
          style={{
            fontSize: designTokens.typography.fontSize.lg,
            fontWeight: designTokens.typography.fontWeight.semibold,
            color: designTokens.colors.text.primary,
          }}
        >
          {title}
        </h3>
        {actions && (
          <div className="flex items-center gap-2" style={{ gap: designTokens.spacing[2] }}>
            {actions}
          </div>
        )}
      </div>
      {subtitle && (
        <p
          className="text-xs"
          style={{
            fontSize: designTokens.typography.fontSize.xs,
            color: designTokens.colors.text.secondary,
          }}
        >
          {subtitle}
        </p>
      )}
    </header>
  );
}
