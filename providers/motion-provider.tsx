"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

interface MotionProviderProps {
  children: React.ReactNode;
}

const transition = {
  duration: 0.2,
  ease: "easeOut" as const,
};

export function MotionProvider({ children }: MotionProviderProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={transition}
        id="main-content"
        tabIndex={-1}
        className="min-h-screen text-white"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
