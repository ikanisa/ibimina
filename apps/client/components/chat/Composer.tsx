"use client";

import { useEffect, useRef } from "react";
import { Loader2, Send, Square } from "lucide-react";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  disabled?: boolean;
  isStreaming: boolean;
  placeholder: string;
  sendLabel: string;
  stopLabel: string;
};

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  isStreaming,
  placeholder,
  sendLabel,
  stopLabel,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="border-t border-neutral-200 bg-white px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3">
        <div className="relative flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (isStreaming) {
                  onStop();
                } else {
                  onSend();
                }
              }
            }}
            placeholder={placeholder}
            className="flex-1 resize-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-[15px] text-neutral-900 placeholder:text-neutral-500 focus:border-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue/40 disabled:cursor-not-allowed disabled:bg-neutral-100"
            disabled={disabled && !isStreaming}
            rows={1}
            aria-label={placeholder}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-11 min-w-[110px] items-center justify-center gap-2 rounded-xl bg-neutral-900 px-4 text-sm font-semibold text-white shadow-atlas transition-colors duration-interactive hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
              <span>{stopLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!value.trim() || disabled}
              className="flex h-11 min-w-[110px] items-center justify-center gap-2 rounded-xl bg-atlas-blue px-4 text-sm font-semibold text-white shadow-atlas transition-colors duration-interactive hover:bg-atlas-blue-dark focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {disabled ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{sendLabel}</span>
            </button>
          )}
        </div>
        <p className="text-center text-xs text-neutral-500">
          {"AI assistant may be wrong. Confirm important information with SACCO staff."}
        </p>
      </div>
    </div>
  );
}
