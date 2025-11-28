"use client";

import { useEffect, useRef } from "react";

/**
 * useFocusTrap Hook
 *
 * Traps keyboard focus within a container element.
 * Useful for modals, drawers, and other overlay components.
 *
 * @param isActive - Whether the focus trap is active
 * @returns Ref to attach to the container element
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
 *   
 *   if (!isOpen) return null;
 *   
 *   return (
 *     <div ref={modalRef} role="dialog">
 *       <button onClick={onClose}>Close</button>
 *       <input type="text" />
 *       <button>Submit</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(isActive: boolean) {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element
    firstElement?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab: focus last element if on first
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: focus first element if on last
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      previouslyFocused?.focus();
    };
  }, [isActive]);

  return containerRef;
}
