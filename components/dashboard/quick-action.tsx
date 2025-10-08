"use client";

import Link from "next/link";
import type { Route } from "next";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BilingualText } from "@/components/common/bilingual-text";

interface QuickActionProps {
  href: Route;
  label: string;
  description?: string;
  secondaryLabel?: string;
  secondaryDescription?: string;
}

export function QuickAction({ href, label, description, secondaryLabel, secondaryDescription }: QuickActionProps) {
  return (
    <Link href={href} className="block">
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-neutral-0 shadow-glass"
        )}
      >
        <div>
          <BilingualText
            primary={<span className="text-sm font-semibold text-neutral-0">{label}</span>}
            secondary={secondaryLabel ?? label}
            secondaryClassName="text-[11px] uppercase tracking-[0.25em] text-neutral-3"
          />
          {description && (
            <BilingualText
              primary={<span className="mt-1 block text-xs text-neutral-2">{description}</span>}
              secondary={secondaryDescription ?? description}
              className="mt-1"
              secondaryClassName="text-[11px] text-neutral-3"
            />
          )}
        </div>
        <span className="mt-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.3em] text-neutral-2 transition group-hover:text-neutral-0">
          Go →
        </span>
      </motion.div>
    </Link>
  );
}
