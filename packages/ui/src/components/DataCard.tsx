"use client";

import { createContext, useContext, forwardRef } from "react";
import type { ReactNode, HTMLAttributes, ComponentType } from "react";
import { cn } from "../utils/cn";
import { Skeleton } from "./skeleton";

const DataCardContext = createContext<{ loading?: boolean }>({});

export interface DataCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * DataCard Root Component
 *
 * A compound component for displaying data with loading states and click interactions.
 * Use with DataCard.Header, DataCard.Value, DataCard.Description, and DataCard.Footer.
 *
 * @example
 * ```tsx
 * <DataCard loading={isLoading} onClick={() => navigate('/details')}>
 *   <DataCard.Header icon={TrendingUp} title="Revenue" action={<Badge>New</Badge>} />
 *   <DataCard.Value value="$12,345" trend="up" suffix="USD" />
 *   <DataCard.Description>↑ 12% from last month</DataCard.Description>
 *   <DataCard.Footer><Button>View Details</Button></DataCard.Footer>
 * </DataCard>
 * ```
 */
const DataCardRoot = forwardRef<HTMLDivElement, DataCardProps>(function DataCard(
  { children, loading, className, onClick, ...props },
  ref
) {
  return (
    <DataCardContext.Provider value={{ loading }}>
      <div
        ref={ref}
        className={cn(
          "group rounded-xl border bg-card p-5 transition-all duration-200",
          "border-neutral-200 dark:border-neutral-700",
          onClick &&
            "cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 dark:hover:border-primary/30",
          className
        )}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        {...props}
      >
        {children}
      </div>
    </DataCardContext.Provider>
  );
});

export interface DataCardHeaderProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  action?: ReactNode;
}

function DataCardHeader({ icon: Icon, title, action }: DataCardHeaderProps) {
  const { loading } = useContext(DataCardContext);

  if (loading) return <Skeleton className="h-6 w-32" />;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      {action}
    </div>
  );
}

export interface DataCardValueProps {
  value: string | number;
  trend?: "up" | "down" | "neutral";
  suffix?: string;
}

function DataCardValue({ value, trend, suffix }: DataCardValueProps) {
  const { loading } = useContext(DataCardContext);

  if (loading) return <Skeleton className="h-9 w-24" />;

  const trendColors = {
    up: "text-emerald-500 dark:text-emerald-400",
    down: "text-rose-500 dark:text-rose-400",
    neutral: "text-muted-foreground",
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-semibold tracking-tight text-foreground">{value}</span>
      {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
      {trend && (
        <span className={cn("text-sm font-medium", trendColors[trend])}>
          {trendIcons[trend]}
        </span>
      )}
    </div>
  );
}

export interface DataCardDescriptionProps {
  children: ReactNode;
}

function DataCardDescription({ children }: DataCardDescriptionProps) {
  const { loading } = useContext(DataCardContext);

  if (loading) return <Skeleton className="h-4 w-48 mt-2" />;

  return <p className="text-sm text-muted-foreground mt-2">{children}</p>;
}

export interface DataCardFooterProps {
  children: ReactNode;
}

function DataCardFooter({ children }: DataCardFooterProps) {
  return (
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
      {children}
    </div>
  );
}

export const DataCard = Object.assign(DataCardRoot, {
  Header: DataCardHeader,
  Value: DataCardValue,
  Description: DataCardDescription,
  Footer: DataCardFooter,
});
