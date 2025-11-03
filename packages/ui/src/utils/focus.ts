/**
 * Selector for all focusable elements
 * Used for focus management in modals, drawers, and other overlays
 */
export const FOCUSABLE_ELEMENTS_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR));
}

/**
 * Focus the first focusable element in a container
 */
export function focusFirstElement(container: HTMLElement): void {
  const elements = getFocusableElements(container);
  const firstElement = elements[0];
  firstElement?.focus();
}
