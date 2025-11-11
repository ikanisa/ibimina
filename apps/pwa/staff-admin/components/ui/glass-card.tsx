import type { ReactNode } from "react";

import { Card, CardHeader, type CardPadding } from "./card";

export interface GlassCardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  padding?: CardPadding;
  children: ReactNode;
}

export function GlassCard({
  title,
  subtitle,
  actions,
  className,
  padding = "md",
  children,
}: GlassCardProps) {
  return (
    <Card surface="translucent" padding={padding} className={className}>
      {(title || subtitle || actions) && (
        <CardHeader title={title} description={subtitle} actions={actions} />
      )}
      {children}
    </Card>
  );
}
