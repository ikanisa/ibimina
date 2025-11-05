"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "agent";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIChatProps {
  orgId: string;
  onClose?: () => void;
}

export function AIChat({ orgId, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "1",
      sender: "agent",
      content: orgId
        ? `Muraho! I'm your SACCO+ AI assistant for organisation ${orgId}. Ask me about USSD payments, reference tokens, statements, or any questions about your account.`
        : "Muraho! I'm your SACCO+ AI assistant. How can I help you today? Ask me about USSD payments, reference tokens, statements, or any questions about your account.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const simulateStreaming = async (fullText: string, messageId: string) => {
    const words = fullText.split(" ");
    let currentText = "";

    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? " " : "") + words[i];

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: currentText, isStreaming: i < words.length - 1 }
            : msg
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100));
    }

    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, isStreaming: false } : msg))
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    controllerRef.current?.abort();

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    const agentMessageId = (Date.now() + 1).toString();

    const agentMessage: Message = {
      id: agentMessageId,
      sender: "agent",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, agentMessage]);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const fullResponse = `I understand you're asking about "${userMessage.content}". I'm here to help with USSD payments, reference tokens, account statements, and general SACCO questions. Could you please provide more details about what you'd like to know?`;

    await simulateStreaming(fullResponse, agentMessageId);

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    const controller = controllerRef.current;
    return () => {
      controller?.abort();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-neutral-200 bg-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-atlas-blue to-atlas-blue-dark">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-neutral-900">SACCO+ Support</h2>
          <p className="text-xs text-neutral-700">AI Assistant</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close chat"
          >
            ✕
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="flex-shrink-0">
                {message.sender === "agent" ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-atlas-blue to-atlas-blue-dark">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-white text-xs font-semibold">
                    You
                  </div>
                )}
              </div>
              <div
                className={`flex flex-col ${message.sender === "user" ? "items-end" : "items-start"} flex-1`}
              >
                <div
                  className={`inline-block rounded-2xl px-4 py-3 max-w-[85%] ${
                    message.sender === "user"
                      ? "bg-atlas-blue text-white"
                      : "bg-neutral-100 text-neutral-900"
                  }`}
                >
                  <p className="text-[15px] leading-6 whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse"></span>
                    )}
                  </p>
                </div>
                <span className="mt-1 text-xs text-neutral-700">
                  {message.timestamp.toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.sender !== "agent" && (
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-atlas-blue to-atlas-blue-dark">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="inline-block rounded-2xl bg-neutral-100 px-4 py-3">
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message SACCO+ Support..."
              className="flex-1 resize-none rounded-2xl border border-neutral-300 bg-white px-4 py-3 pr-12 text-[15px] text-neutral-900 placeholder:text-neutral-700 focus:border-atlas-blue focus:outline-none focus:ring-1 focus:ring-atlas-blue transition-colors min-h-[52px] max-h-[200px]"
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg bg-atlas-blue text-white hover:bg-atlas-blue-dark focus:outline-none focus:ring-2 focus:ring-atlas-blue focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-atlas-blue transition-all"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-neutral-700">
            AI assistant may make mistakes. Verify important information with SACCO staff.
            {error && <span className="block text-red-500 mt-2">{error}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
