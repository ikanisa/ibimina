"use client";

import { AIChat } from "@/components/ai-chat/ai-chat";
import { useState } from "react";

/**
 * Support Page
 *
 * AI-powered customer support chat interface.
 * Feature-flagged page for AI agent support.
 */
export default function SupportPage() {
  // TODO: Get actual org_id from user context
  const [orgId] = useState("placeholder-org-id");

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-neutral-50 to-neutral-100 pb-20">
      <AIChat orgId={orgId} />
    </div>
  );
}
