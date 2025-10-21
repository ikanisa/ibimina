import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-kigali text-ink shadow-glass hover:bg-kigali/90 focus-visible:ring-kigali/80 disabled:bg-kigali/40 disabled:text-ink/60",
  secondary:
    "bg-white/10 text-neutral-0 shadow-glass hover:bg-white/20 focus-visible:ring-white/40 disabled:bg-white/10 disabled:text-neutral-3",
  ghost:
    "bg-transparent text-neutral-0 hover:bg-white/10 focus-visible:ring-white/30 disabled:text-neutral-3",
  destructive:
    "bg-[#ff6b6b] text-ink shadow-glass hover:bg-[#ff7d7d] focus-visible:ring-[#ff6b6b]/60 disabled:bg-[#ff6b6b]/40 disabled:text-ink/60",
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-6 py-4 text-base",
  icon: "h-10 w-10 p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", fullWidth = false, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.3em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? "w-full" : undefined,
        className,
      )}
      {...props}
    />
  );
});
