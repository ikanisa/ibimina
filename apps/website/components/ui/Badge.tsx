import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  dot?: boolean;
}

export function Badge({
  variant = "default",
  size = "md",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-brand-blue/10 text-brand-blue",
    success: "bg-success-50 text-success-700",
    warning: "bg-warning-50 text-warning-700",
    error: "bg-error-50 text-error-700",
    info: "bg-info-50 text-info-700",
    neutral: "bg-neutral-100 text-neutral-700",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const dotColors = {
    default: "bg-brand-blue",
    success: "bg-success-500",
    warning: "bg-warning-500",
    error: "bg-error-500",
    info: "bg-info-500",
    neutral: "bg-neutral-500",
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      role="status"
      {...props}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotColors[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export interface StatusBadgeProps {
  status: "pending" | "confirmed" | "failed" | "processing";
  children?: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      variant: "warning" as const,
      label: "Pending",
      dot: true,
    },
    confirmed: {
      variant: "success" as const,
      label: "Confirmed",
      dot: true,
    },
    failed: {
      variant: "error" as const,
      label: "Failed",
      dot: false,
    },
    processing: {
      variant: "info" as const,
      label: "Processing",
      dot: true,
    },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot={config.dot} aria-label={`Status: ${config.label}`}>
      {children || config.label}
    </Badge>
  );
}
