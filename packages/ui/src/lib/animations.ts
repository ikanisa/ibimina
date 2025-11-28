import type { Variants } from "framer-motion";

/**
 * Animation Utilities for Framer Motion
 *
 * Provides consistent animation variants across the application.
 * All animations respect prefers-reduced-motion user preference.
 */

/**
 * Page Transitions
 * Used for animating route changes
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

/**
 * Stagger Container & Items
 * Used for animating lists with staggered delays
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/**
 * Scale on Hover
 * Used for interactive cards and buttons
 */
export const scaleOnHover: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  tap: { scale: 0.98 },
};

/**
 * Slide In Animations
 * Used for drawers, modals, and panels
 */
export const slideIn = (
  direction: "left" | "right" | "up" | "down" = "up"
): Variants => ({
  hidden: {
    opacity: 0,
    x: direction === "left" ? -20 : direction === "right" ? 20 : 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
  },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: direction === "left" ? -20 : direction === "right" ? 20 : 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
    transition: { duration: 0.2, ease: "easeIn" },
  },
});

/**
 * Fade Animation
 * Simple opacity transition
 */
export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeInOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeInOut" },
  },
};

/**
 * Skeleton Pulse
 * Loading state animation
 */
export const skeletonPulse: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Scale In Animation
 * Used for modals and dialogs
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/**
 * Bounce Animation
 * Used for notifications and alerts
 */
export const bounce: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
    },
  },
};
