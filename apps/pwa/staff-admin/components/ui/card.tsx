"use client";

import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

export type CardSurface = "base" | "subtle" | "contrast" | "elevated" | "translucent";
export type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING_MAP: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const BORDER_MAP: Record<CardSurface, string> = {
  base: "border border-[var(--color-border)]",
  subtle: "border border-[var(--color-border-subtle)]",
  contrast: "border border-transparent",
  elevated: "border border-[var(--color-border)]",
  translucent: "border border-[var(--surface-glass-border)]",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface;
  padding?: CardPadding;
  interactive?: boolean;
  radius?: "md" | "lg" | "xl";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { surface = "base", padding = "md", interactive = false, radius = "xl", className, ...rest },
  ref
) {
  return (
    <section
      ref={ref}
      data-surface={surface}
      className={cn(
        "transition-[transform,box-shadow,border-color] duration-200 ease-[var(--motion-ease-standard)]",
        radius === "md" ? "rounded-lg" : radius === "lg" ? "rounded-xl" : "rounded-2xl",
        BORDER_MAP[surface],
        PADDING_MAP[padding],
        surface === "translucent" ? "backdrop-saturate-150" : null,
        interactive ? "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]" : null,
        className
      )}
      {...rest}
    />
  );
});

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(function CardHeader(
  { eyebrow, title, description, actions, className, children, ...rest },
  ref
) {
  return (
    <header
      ref={ref}
      className={cn(
        "mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...rest}
    >
      <div className="flex-1 space-y-1">
        {eyebrow ? (
          <Typography variant="caption" tone="muted" className="tracking-[0.18em]">
            {eyebrow}
          </Typography>
        ) : null}
        {title ? (
          <Typography variant="h4" as="h2">
            {title}
          </Typography>
        ) : null}
        {description ? (
          <Typography variant="body" tone="subtle">
            {description}
          </Typography>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
});

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(function CardContent(
  { className, ...rest },
  ref
) {
  return <div ref={ref} className={cn("space-y-4", className)} {...rest} />;
});

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(function CardFooter(
  { className, ...rest },
  ref
) {
  return (
    <footer
      ref={ref}
      className={cn(
        "mt-6 flex flex-col gap-3 border-t border-[var(--color-border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...rest}
    />
  );
});

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(function CardTitle(
  { className, children, ...rest },
  ref
) {
  return (
    <Typography ref={ref} as="h3" variant="h5" className={cn("font-semibold", className)} {...rest}>
      {children}
    </Typography>
  );
});

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  function CardDescription({ className, children, ...rest }, ref) {
    return (
      <Typography ref={ref} as="p" variant="body" tone="subtle" className={className} {...rest}>
        {children}
      </Typography>
    );
  }
);
