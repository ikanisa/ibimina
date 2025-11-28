"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageVariants } from "../lib/animations";
import { cn } from "../utils/cn";

export interface AnimatedPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * AnimatedPage Component
 *
 * Wraps page content with enter/exit animations for smooth transitions.
 * Works with Next.js App Router and client-side navigation.
 *
 * @example
 * ```tsx
 * export default function HomePage() {
 *   return (
 *     <AnimatedPage>
 *       <h1>Welcome</h1>
 *       <p>Page content...</p>
 *     </AnimatedPage>
 *   );
 * }
 * ```
 */
export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={cn("w-full", className)}
    >
      {children}
    </motion.div>
  );
}
