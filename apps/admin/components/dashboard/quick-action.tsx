"use client";

import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { track } from "@/src/lib/analytics";

interface QuickActionProps {
  href: Route;
  label: ReactNode;
  description?: ReactNode;
  eventName?: string;
  eventProperties?: Record<string, unknown>;
}

export function QuickAction({
  href,
  label,
  description,
  eventName,
  eventProperties,
}: QuickActionProps) {
  const handleClick = () => {
    if (eventName) {
      void track(eventName, eventProperties);
    }
  };

  return (
    <Link href={href} className="block" onClick={handleClick}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-neutral-0 shadow-glass"
        )}
      >
        <div>
          <span className="text-sm font-semibold text-neutral-0">{label}</span>
          {description && <span className="mt-1 block text-xs text-neutral-2">{description}</span>}
        </div>
        <span className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-neutral-2 transition group-hover:text-neutral-0">
          Go →
        </span>
      </motion.div>
    </Link>
  );
}
