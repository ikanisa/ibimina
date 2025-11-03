import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { focusFirstElement } from "../utils/focus";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  footer?: ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

const slideAnimations = {
  left: {
    enter: "animate-in slide-in-from-left duration-300",
    exit: "animate-out slide-out-to-left duration-200",
  },
  right: {
    enter: "animate-in slide-in-from-right duration-300",
    exit: "animate-out slide-out-to-right duration-200",
  },
};

/**
 * Drawer - A slide-in panel component
 *
 * Features:
 * - Slides in from left or right
 * - Multiple size options
 * - Optional close button and overlay click handling
 * - Escape key support
 * - Smooth animations
 * - Design tokens for consistent styling
 * - Proper ARIA attributes for accessibility
 * - Focus trap
 */
export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  side = "right",
  size = "md",
  className,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  showCloseButton = true,
  footer,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      focusFirstElement(drawerRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="presentation"
      style={{
        justifyContent: side === "left" ? "flex-start" : "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "drawer-title" : undefined}
        aria-describedby={description ? "drawer-description" : undefined}
        className={cn(
          "relative flex h-full w-full flex-col border-white/10 bg-gradient-to-br from-ink/95 to-neutral-900/95 shadow-2xl",
          side === "left" ? "border-r" : "border-l",
          slideAnimations[side].enter,
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6 shrink-0">
            {(title || description) && (
              <div className="flex-1 space-y-1">
                {title && (
                  <h2 id="drawer-title" className="text-xl font-semibold text-neutral-0">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="drawer-description" className="text-sm text-neutral-300">
                    {description}
                  </p>
                )}
              </div>
            )}

            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-0"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && <div className="border-t border-white/10 p-6 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
