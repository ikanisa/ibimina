"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { cn } from "../utils/cn";

export interface SmartInputProps {
  value: string;
  onChange: (value: string) => void;
  onAcceptSuggestion?: (suggestion: string) => void;
  placeholder?: string;
  suggestions?: string[];
  aiEnabled?: boolean;
  className?: string;
  name?: string;
  disabled?: boolean;
}

/**
 * SmartInput Component
 *
 * AI-enhanced input with autocomplete suggestions.
 * Press Tab to accept AI suggestions, use arrow keys to navigate static suggestions.
 *
 * @example
 * ```tsx
 * function SearchForm() {
 *   const [query, setQuery] = useState('');
 *   
 *   return (
 *     <SmartInput
 *       value={query}
 *       onChange={setQuery}
 *       placeholder="Search members..."
 *       suggestions={['John Doe', 'Jane Smith']}
 *       aiEnabled
 *       onAcceptSuggestion={(suggestion) => handleSearch(suggestion)}
 *     />
 *   );
 * }
 * ```
 */
export function SmartInput({
  value,
  onChange,
  onAcceptSuggestion,
  placeholder,
  suggestions = [],
  aiEnabled = true,
  className,
  name,
  disabled,
}: SmartInputProps) {
  const [focused, setFocused] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulate AI suggestion (replace with actual AI call)
  useEffect(() => {
    if (!aiEnabled || !value || value.length < 3) {
      setAiSuggestion(null);
      setIsLoadingSuggestion(false);
      return;
    }

    setIsLoadingSuggestion(true);

    const timer = setTimeout(() => {
      // TODO: Replace with actual AI/API call
      // Example: const suggestion = await aiService.complete(value);
      const mockSuggestion =
        value.length > 5 ? `${value} - AI suggested completion` : null;
      setAiSuggestion(mockSuggestion);
      setIsLoadingSuggestion(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      setIsLoadingSuggestion(false);
    };
  }, [value, aiEnabled]);

  const acceptSuggestion = () => {
    if (aiSuggestion) {
      onChange(aiSuggestion);
      onAcceptSuggestion?.(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleStaticSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    onAcceptSuggestion?.(suggestion);
    inputRef.current?.blur();
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Tab" && aiSuggestion) {
            e.preventDefault();
            acceptSuggestion();
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border bg-background px-4 py-2.5 text-sm",
          "border-neutral-300 dark:border-neutral-700",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all duration-200",
          aiEnabled && "pr-10"
        )}
      />

      {/* AI Indicator */}
      {aiEnabled && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Sparkles
            className={cn(
              "h-4 w-4 transition-colors",
              isLoadingSuggestion && "animate-pulse",
              aiSuggestion
                ? "text-primary animate-pulse"
                : "text-muted-foreground/50"
            )}
          />
        </div>
      )}

      {/* AI Suggestion Popup */}
      <AnimatePresence>
        {focused && aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full mt-1 z-50"
          >
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-card p-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Sparkles className="h-3 w-3 text-primary" />
                AI Suggestion
                <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded">
                  Tab to accept
                </span>
              </div>
              <button
                onClick={acceptSuggestion}
                className="w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors"
              >
                {aiSuggestion}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static Suggestions */}
      <AnimatePresence>
        {focused && suggestions.length > 0 && !aiSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full mt-1 z-50"
          >
            <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-card shadow-lg overflow-hidden">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleStaticSuggestionClick(suggestion)}
                  className="w-full text-left text-sm px-4 py-2.5 hover:bg-muted transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
