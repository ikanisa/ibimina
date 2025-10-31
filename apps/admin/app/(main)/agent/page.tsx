/**
 * Agent Chat Page
 *
 * Full-screen interface for the autonomous AI customer support agent
 */

import { AgentChat } from "@/components/agent/AgentChat";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Support Assistant | Ibimina",
  description:
    "Get instant help from our AI-powered customer support assistant for all your SACCO management questions.",
};

export default function AgentPage() {
  return (
    <div className="h-screen flex flex-col">
      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        <AgentChat />
      </div>
    </div>
  );
}
