"use client";

import { useCallback, useEffect, useId, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { MouseEvent, ReactNode, RefObject } from "react";
import { X } from "lucide-react";

import { cn } from "../utils/cn";
import { designTokens } from "../theme/design-tokens";

const FOCUSABLE_SELECTOR =
  'a[href]:not([tabindex="-1"]),button:not([disabled]):not([tabindex="-1"]),textarea:not([disabled]):not([tabindex="-1"]),input:not([disabled]):not([tabindex="-1"]),select:not([disabled]):not([tabindex="-1"]),[tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement | null) {
  if (!container) return [] as HTMLElement[];
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden")
  );
}

const SIZE_STYLES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[min(92vw,68rem)]",
};

export interface ModalRenderProps {
  close: () => void;
  titleId: string;
  descriptionId?: string;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode | ((context: ModalRenderProps) => ReactNode);
  size?: "sm" | "md" | "lg" | "xl" | "full";
  className?: string;
  initialFocusRef?: RefObject<HTMLElement> | null;
  hideCloseButton?: boolean;
  labelledBy?: string;
  describedBy?: string;
  closeOnOverlayClick?: boolean;
}

/**
 * Modal - Accessible dialog component with design tokens
 *
 * Features:
 * - Full WCAG 2.2 AA compliance
 * - Focus trap and management
 * - ESC key to close
 * - Click outside to close (configurable)
 * - Scroll lock
 * - Smooth animations with reduced-motion support
 * - Design token integration
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Payment"
 *   description="Are you sure you want to proceed?"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
 *     </>
 *   }
 * >
 *   <p>Payment details...</p>
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
  className,
  initialFocusRef,
  hideCloseButton = false,
  labelledBy,
  describedBy,
  closeOnOverlayClick = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();

  // Focus management on open
  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusTarget = initialFocusRef?.current ?? getFocusable(panel)[0] ?? panel;

    focusTarget?.focus({ preventScroll: true });

    const restoreFocus = () => {
      if (previouslyFocused && previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };

    return () => restoreFocus();
  }, [open, initialFocusRef]);

  // Keyboard navigation (ESC and Tab trap)
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusable(panel);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? (currentIndex - 1 + focusable.length) % focusable.length
        : (currentIndex + 1) % focusable.length;
      event.preventDefault();
      focusable[nextIndex]?.focus({ preventScroll: true });
    };

    panel.addEventListener("keydown", handleKeyDown);
    return () => panel.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const handleOverlayMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!closeOnOverlayClick) return;
      if (event.target === overlayRef.current) {
        onClose();
      }
    },
    [closeOnOverlayClick, onClose]
  );

  const titleId = useMemo(() => labelledBy ?? generatedTitleId, [generatedTitleId, labelledBy]);
  const descriptionId = useMemo(
    () => describedBy ?? (description ? generatedDescriptionId : undefined),
    [description, describedBy, generatedDescriptionId]
  );

  if (!open) {
    return null;
  }

  const content = (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 flex items-center justify-center",
        "bg-black/60 backdrop-blur-sm",
        "transition-opacity",
        `duration-[${designTokens.motion.duration.base}ms]`,
        "motion-reduce:transition-none"
      )}
      style={{
        zIndex: 70,
      }}
      role="presentation"
      onMouseDown={handleOverlayMouseDown}
    >
      <div
        ref={panelRef}
        className={cn(
          "relative w-full",
          "rounded-2xl",
          "border border-neutral-200",
          "bg-white",
          "shadow-2xl",
          "outline-none",
          "transition-all",
          `duration-[${designTokens.motion.duration.base}ms]`,
          "motion-reduce:transition-none",
          "p-6",
          "text-neutral-900",
          SIZE_STYLES[size],
          className
        )}
        style={{
          borderRadius: designTokens.component.modal.borderRadius,
          padding: designTokens.spacing[6],
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : labelledBy}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        {/* Close button */}
        {!hideCloseButton ? (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute right-4 top-4",
              "inline-flex items-center justify-center",
              "h-10 w-10",
              "rounded-full",
              "border border-neutral-300",
              "text-neutral-700",
              "transition-all",
              `duration-[${designTokens.motion.duration.fast}ms]`,
              "hover:border-neutral-400",
              "hover:bg-neutral-100",
              "hover:text-neutral-900",
              "focus-visible:outline-none",
              "focus-visible:ring-3",
              "focus-visible:ring-[#0066FF]/50"
            )}
            style={{
              minWidth: designTokens.size.touchTarget.minimum,
              minHeight: designTokens.size.touchTarget.minimum,
            }}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        ) : null}

        {/* Header */}
        {title ? (
          <div className="space-y-2 pr-12">
            <h2
              id={titleId}
              className="text-xl font-semibold text-neutral-900"
              style={{
                fontSize: designTokens.typography.fontSize.xl,
                fontWeight: designTokens.typography.fontWeight.semibold,
                color: designTokens.colors.text.primary,
              }}
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="text-sm text-neutral-700"
                style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.text.secondary,
                }}
              >
                {description}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Content */}
        <div className={cn("mt-4 space-y-4", title ? "pt-2" : undefined)}>
          {typeof children === "function"
            ? children({ close: onClose, titleId, descriptionId })
            : children}
        </div>

        {/* Footer */}
        {footer ? (
          <footer
            className="mt-6 flex flex-wrap justify-end gap-3"
            style={{
              marginTop: designTokens.spacing[6],
              gap: designTokens.spacing[3],
            }}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
