import { Metadata } from "next";
import { requireUserAndProfile } from "@/lib/auth";
import { ChatPanel } from "@/components/ai/chat-panel";

export const metadata: Metadata = {
  title: "AI Support",
  description: "AI-powered customer support assistant for the Ibimina SACCO platform",
};

export default async function AISupportPage() {
  // Require authentication
  await requireUserAndProfile();

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Support Assistant</h1>
        <p className="text-sm text-gray-400">
          Get instant help with SACCO operations, member management, and platform features
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
