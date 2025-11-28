"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  fullScreen?: boolean;
  className?: string;
}

/**
 * LoadingState Component
 *
 * Smart loading indicator with multiple variants and sizes.
 * Can be used inline or as a full-screen overlay.
 *
 * @example
 * ```tsx
 * // Inline spinner
 * <LoadingState message="Loading data..." size="md" />
 * 
 * // Full-screen overlay
 * <LoadingState message="Processing..." fullScreen />
 * 
 * // Dots variant
 * <LoadingState variant="dots" size="sm" />
 * ```
 */
export function LoadingState({
  message,
  size = "md",
  variant = "spinner",
  fullScreen = false,
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullScreen ? "min-h-screen" : "py-12",
        className
      )}
    >
      {/* Loading Indicator */}
      {variant === "spinner" && (
        <Loader2
          className={cn(
            sizeClasses[size],
            "animate-spin text-primary"
          )}
        />
      )}

      {variant === "dots" && <LoadingDots size={size} />}
      
      {variant === "pulse" && <LoadingPulse size={size} />}
      
      {variant === "skeleton" && <LoadingSkeleton />}

      {/* Message */}
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-muted-foreground"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

function LoadingDots({ size }: { size: "sm" | "md" | "lg" }) {
  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  return (
    <div className="flex gap-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn(
            dotSizes[size],
            "rounded-full bg-primary"
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
}

function LoadingPulse({ size }: { size: "sm" | "md" | "lg" }) {
  const pulseSizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className="relative">
      <motion.div
        className={cn(
          pulseSizes[size],
          "rounded-full bg-primary/20"
        )}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={cn(
          pulseSizes[size],
          "rounded-full bg-primary/40 absolute inset-0"
        )}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.7, 0, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-sm space-y-3">
      {[...Array(3)].map((_, index) => (
        <motion.div
          key={index}
          className="h-12 bg-muted rounded-lg"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
}
