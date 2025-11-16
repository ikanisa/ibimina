import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  hover?: boolean;
}

export function Card({
  variant = "default",
  padding = "md",
  hover = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const variants = {
    default: "bg-white border border-neutral-200 rounded-xl",
    bordered: "bg-white border-2 border-neutral-300 rounded-xl",
    elevated: "bg-white border border-neutral-200 rounded-xl shadow-lg",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-12",
  };

  const hoverClass = hover
    ? "hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1 transition-all duration-200"
    : "";

  return (
    <div
      className={`${variants[variant]} ${paddings[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function CardHeader({ title, description, action, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-neutral-900 mb-2">{title}</h3>
        {description && <p className="text-sm text-neutral-600">{description}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className = "", children, ...props }: CardContentProps) {
  return (
    <div className={`text-neutral-600 ${className}`} {...props}>
      {children}
    </div>
  );
}

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className = "", children, ...props }: CardFooterProps) {
  return (
    <div className={`mt-6 pt-6 border-t border-neutral-200 ${className}`} {...props}>
      {children}
    </div>
  );
}
