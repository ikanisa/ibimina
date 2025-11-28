"use client";

import { useState, useEffect, ComponentType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import { cn } from "../utils/cn";

export interface QuickActionItem {
  id: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  action: () => void;
  ai?: boolean;
  variant?: "default" | "primary";
}

export interface QuickActionsButtonProps {
  actions: QuickActionItem[];
  maxVisible?: number;
  aiSuggestions?: QuickActionItem[];
  className?: string;
}

/**
 * QuickActionsButton Component
 *
 * Displays a list of quick action buttons with optional AI suggestions.
 * AI-suggested actions appear with sparkles and primary styling.
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const actions = [
 *     { id: 'new-task', icon: Plus, label: 'New Task', action: () => openNewTask() },
 *     { id: 'upload', icon: Upload, label: 'Upload', action: () => openUpload() },
 *   ];
 *
 *   return (
 *     <QuickActionsButton
 *       actions={actions}
 *       maxVisible={5}
 *     />
 *   );
 * }
 * ```
 */
export function QuickActionsButton({
  actions,
  maxVisible = 5,
  aiSuggestions = [],
  className,
}: QuickActionsButtonProps) {
  const [displayActions, setDisplayActions] = useState<QuickActionItem[]>([]);

  useEffect(() => {
    // Merge AI suggestions with regular actions
    const merged = [...aiSuggestions.map((a) => ({ ...a, ai: true })), ...actions].slice(
      0,
      maxVisible
    );

    setDisplayActions(merged);
  }, [actions, aiSuggestions, maxVisible]);

  if (displayActions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {displayActions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: index * 0.05 }}
          onClick={action.action}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            action.ai
              ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
              : action.variant === "primary"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-foreground hover:bg-muted/80"
          )}
          title={action.description}
          aria-label={action.description || action.label}
        >
          {action.ai && <Sparkles className="w-3.5 h-3.5" />}
          <action.icon className="w-4 h-4" />
          <span>{action.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
