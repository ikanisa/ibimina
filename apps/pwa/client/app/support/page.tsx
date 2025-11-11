"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AIChat } from "@/components/ai-chat/ai-chat";
import { useFeatureFlags } from "@/hooks/use-feature-flags";

/**
 * Support Page
 *
 * AI-powered customer support chat interface.
 * Feature-flagged page for AI agent support.
 */
export default function SupportPage() {
  // TODO: Get actual org_id from user context
  const [orgId] = useState("placeholder-org-id");
  const { isEnabled } = useFeatureFlags();
  const assistantGateEnabled = useMemo(() => isEnabled("atlas-assistant"), [isEnabled]);
  const [showAssistant, setShowAssistant] = useState(assistantGateEnabled);
  const assistantPanelId = "support-assistant-panel";

  useEffect(() => {
    if (!assistantGateEnabled) {
      return;
    }

    const handleHotkey = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault();
        setShowAssistant((value) => !value);
      }
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [assistantGateEnabled]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-neutral-50 to-neutral-100 pb-20">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-8">
        <header className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full bg-atlas-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-atlas-blue-dark">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Atlas assistant
          </span>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-neutral-900">Need help with SACCO+?</h1>
            <p className="max-w-2xl text-sm text-neutral-700">
              Chat with the SACCO+ AI assistant for troubleshooting, USSD walkthroughs, and
              contribution lookups. Staff can collapse the assistant at any time to return to the
              knowledge base or call support.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 transition hover:border-atlas-blue hover:text-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2"
              aria-controls={assistantPanelId}
              aria-pressed={showAssistant}
              onClick={() => setShowAssistant((value) => !value)}
            >
              {showAssistant ? "Hide assistant" : "Open assistant"}
            </button>
            {!assistantGateEnabled && (
              <span className="text-xs text-neutral-700">
                Atlas assistant is staged for beta tenants. Enable the{" "}
                <code className="rounded bg-neutral-200 px-1 py-0.5 text-[11px]">
                  atlasAssistant
                </code>{" "}
                flag to expose it.
              </span>
            )}
          </div>
        </header>

        {assistantGateEnabled ? (
          showAssistant ? (
            <section
              id={assistantPanelId}
              role="region"
              aria-label="SACCO+ assistant chat"
              className="flex-1 overflow-hidden rounded-3xl border border-neutral-200 shadow-lg"
            >
              <AIChat orgId={orgId} onClose={() => setShowAssistant(false)} />
            </section>
          ) : (
            <section
              id={assistantPanelId}
              role="status"
              aria-live="polite"
              className="flex min-h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white text-center shadow-inner"
            >
              <Sparkles className="mb-4 h-8 w-8 text-atlas-blue" aria-hidden="true" />
              <p className="text-sm font-semibold text-neutral-800">Assistant hidden</p>
              <p className="mt-1 max-w-md text-xs text-neutral-700">
                Use the toggle above or press{" "}
                <kbd className="rounded bg-neutral-200 px-1">Shift</kbd> +{" "}
                <kbd className="rounded bg-neutral-200 px-1">A</kbd> to reopen the chat.
              </p>
            </section>
          )
        ) : (
          <section
            id={assistantPanelId}
            role="status"
            aria-live="polite"
            className="flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white text-center"
          >
            <p className="text-sm font-semibold text-neutral-700">Assistant rollout pending</p>
            <p className="mt-1 max-w-md text-xs text-neutral-700">
              Ops can enable the Atlas assistant for a SACCO cohort from the feature flag dashboard.
              Legacy support channels remain available in the meantime.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
