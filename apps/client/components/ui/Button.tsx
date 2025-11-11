import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const variants = {
    primary:
      "bg-brand-blue text-white hover:bg-brand-blue-dark active:bg-brand-blue-darker focus-visible:ring-brand-blue/30",
    secondary:
      "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus-visible:ring-neutral-500",
    outline:
      "border-2 border-neutral-300 text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:ring-neutral-500",
    ghost:
      "text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus-visible:ring-neutral-500",
    danger:
      "bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus-visible:ring-error-600",
  };

  const sizes = {
    sm: "px-3 py-2 text-sm rounded-lg gap-1.5 h-10", // 40px
    md: "px-4 py-2.5 text-base rounded-lg gap-2 h-11", // 44px
    lg: "px-6 py-3 text-lg rounded-xl gap-2.5 h-12", // 48px
  };

  const widthClass = fullWidth ? "w-full" : "";
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex">{rightIcon}</span>}
        </>
      )}
    </button>
  );
}
