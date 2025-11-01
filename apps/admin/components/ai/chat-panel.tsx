"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";
import { track } from "@/src/lib/analytics";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "streaming" | "complete" | "error";
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm your AI support assistant for the Ibimina SACCO platform. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const appendAssistantMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.id === message.id);
      if (index >= 0) {
        next[index] = message;
        return next;
      }
      return [...next, message];
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantId = `${userMessage.id}-assistant`;
    const decoder = new TextDecoder();
    const startTime = performance.now();
    let firstChunkAt: number | null = null;

    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      status: "streaming",
    };

    appendAssistantMessage(assistantMessage);

    try {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Response streaming not supported");
      }

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          if (!part.startsWith("data:")) continue;
          const payload = part.replace(/^data:\s*/, "");
          if (!payload) continue;

          let parsed:
            | { type?: string; data?: string; metrics?: Record<string, unknown> }
            | undefined;
          try {
            parsed = JSON.parse(payload);
          } catch (error) {
            console.warn("Invalid stream payload", error, payload);
            continue;
          }

          if (!firstChunkAt && parsed?.type === "token") {
            firstChunkAt = performance.now();
            void track({
              event: "chat_start",
              properties: {
                ttftMs: firstChunkAt - startTime,
                messageLength: userMessage.content.length,
              },
            });
          }

          if (parsed?.type === "token" && typeof parsed.data === "string") {
            assistantMessage.content += parsed.data;
            appendAssistantMessage({ ...assistantMessage });
          }

          if (parsed?.type === "metrics" && parsed.metrics) {
            void track({ event: "chat_latency_recorded", properties: parsed.metrics });
          }
        }
      }

      assistantMessage.status = "complete";
      appendAssistantMessage({ ...assistantMessage });
    } catch (error) {
      console.error("Error sending message:", error);
      Sentry.captureException(error);
      const errorMessage: Message = {
        id: `${assistantId}-error`,
        role: "assistant",
        content: "I'm sorry, there was an error processing your request. Please try again.",
        timestamp: new Date(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-white/10 bg-white/5">
      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-busy={isLoading}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-100"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p
                className={`mt-1 text-xs ${
                  message.role === "user" ? "text-blue-200" : "text-gray-400"
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
                {message.status === "streaming" && " · typing"}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg bg-white/10 px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
