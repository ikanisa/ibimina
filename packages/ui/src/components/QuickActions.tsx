"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "../utils/cn";

export interface QuickAction {
  id: string;
  icon: ComponentType<{ className?: string }> | string;
  label: string;
  description?: string;
  action: () => void;
  ai?: boolean;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  maxVisible?: number;
  className?: string;
}

/**
 * QuickActions Component
 *
 * Context-aware quick action buttons.
 * AI-suggested actions are visually differentiated with Sparkles icon.
 *
 * @example
 * ```tsx
 * import { Plus, Upload, FileText } from "lucide-react";
 * 
 * const actions = [
 *   { id: 'new-task', icon: Plus, label: 'New Task', action: () => openNewTask() },
 *   { id: 'upload', icon: Upload, label: 'Upload', action: () => openUpload(), ai: true },
 *   { id: 'new-doc', icon: FileText, label: 'New Document', action: () => openNewDoc() },
 * ];
 * 
 * <QuickActions actions={actions} maxVisible={5} />
 * ```
 */
export function QuickActions({
  actions,
  maxVisible = 5,
  className,
}: QuickActionsProps) {
  const visibleActions = actions.slice(0, maxVisible);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {visibleActions.map((action, index) => {
        const IconComponent =
          typeof action.icon === "string" ? null : action.icon;

        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            onClick={action.action}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
              "transition-all duration-200",
              action.ai
                ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
            title={action.description}
          >
            {action.ai && <Sparkles className="w-3 h-3" />}
            {IconComponent ? (
              <IconComponent className="w-4 h-4" />
            ) : typeof action.icon === "string" ? (
              <span className="text-base">{action.icon}</span>
            ) : null}
            <span>{action.label}</span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
