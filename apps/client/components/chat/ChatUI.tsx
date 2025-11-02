"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Message } from "./Message";
import { Composer } from "./Composer";
import {
  AllocationPayload,
  ChatMessage,
  MessageContent,
  QuickActionKey,
  SupportedLocale,
  TicketPayload,
} from "./types";
import { streamSSE } from "@/lib/chat/sse";
import { Sparkles } from "lucide-react";

const translations: Record<SupportedLocale, Record<string, string>> = {
  rw: {
    title: "Umufasha wa SACCO+",
    subtitle: "AI umenya ibya konti yawe",
    placeholder: "Andikira umufasha...",
    send: "Ohereza",
    stop: "Hagarika",
    ussd: "Intambwe za USSD",
    reference: "Indangamuryango",
    statements: "Raporo",
    ticket: "Fungura itike",
    language: "Ururimi",
  },
  en: {
    title: "SACCO+ Support",
    subtitle: "AI assistant for your account",
    placeholder: "Message SACCO+ agent...",
    send: "Send",
    stop: "Stop",
    ussd: "USSD steps",
    reference: "My reference",
    statements: "Statements",
    ticket: "Open ticket",
    language: "Language",
  },
  fr: {
    title: "Assistance SACCO+",
    subtitle: "Assistant IA pour votre compte",
    placeholder: "Écrire à l’agent SACCO+...",
    send: "Envoyer",
    stop: "Arrêter",
    ussd: "Étapes USSD",
    reference: "Mon identifiant",
    statements: "Relevés",
    ticket: "Ouvrir un ticket",
    language: "Langue",
  },
};

const quickActionPrompts: Record<QuickActionKey, string> = {
  ussd: "Show me the USSD steps for making a contribution.",
  reference: "What is my reference token and how do I use it?",
  statements: "Summarise my recent allocations and statements.",
  ticket: "Open a support ticket for a failed contribution.",
};

type ChatUIProps = {
  orgId?: string;
  initialLocale?: SupportedLocale;
};

type SSEPayload =
  | { type: "message-start"; messageId: string }
  | { type: "message-delta"; messageId: string; delta: string }
  | { type: "message-end"; messageId: string }
  | { type: "allocation"; messageId: string; payload: AllocationPayload }
  | { type: "ticket"; messageId: string; payload: TicketPayload }
  | { type: "error"; message: string };

export function ChatUI({ orgId, initialLocale = "rw" }: ChatUIProps) {
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      createdAt: Date.now(),
      contents: [
        {
          type: "text",
          text: translations[initialLocale].subtitle,
        },
      ],
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<string>(crypto.randomUUID());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === "welcome"
          ? {
              ...message,
              contents: message.contents.map((content) =>
                content.type === "text"
                  ? { ...content, text: translations[locale].subtitle }
                  : content
              ),
            }
          : message
      )
    );
  }, [locale]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const sendPrompt = useCallback(
    async (prompt: string, action?: QuickActionKey) => {
      if (!prompt.trim()) return;
      abortRef.current?.abort();

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        createdAt: Date.now(),
        contents: [{ type: "text", text: prompt }],
      };

      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        createdAt: Date.now(),
        contents: [{ type: "text", text: "", streaming: true }],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/agent/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: prompt,
            locale,
            orgId,
            quickAction: action,
            threadId: threadRef.current,
            messageId: assistantMessageId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        await streamSSE<SSEPayload>({
          response,
          signal: controller.signal,
          onMessage: async ({ data }) => {
            const payload = data as SSEPayload;
            if (payload.type === "error") {
              setError(payload.message);
              return;
            }
            const targetId = payload.messageId ?? assistantMessageId;
            setMessages((prev) => {
              return prev.map((message) => {
                if (message.id !== targetId) return message;
                const updated: ChatMessage = {
                  ...message,
                  contents: [...message.contents],
                };

                if (payload.type === "message-start") {
                  return updated;
                }

                if (payload.type === "message-delta") {
                  let hasText = false;
                  const contents = updated.contents.map((content) => {
                    if (content.type === "text" && !hasText) {
                      hasText = true;
                      return {
                        ...content,
                        text: `${content.text}${payload.delta}`,
                        streaming: true,
                      };
                    }
                    return content;
                  });

                  if (!hasText) {
                    contents.push({ type: "text", text: payload.delta, streaming: true });
                  }

                  return { ...updated, contents };
                }

                if (payload.type === "message-end") {
                  return {
                    ...updated,
                    contents: updated.contents.map((content) =>
                      content.type === "text" ? { ...content, streaming: false } : content
                    ),
                  };
                }

                if (payload.type === "allocation") {
                  const newContent: MessageContent = {
                    type: "allocation",
                    payload: payload.payload,
                  };
                  return { ...updated, contents: [...updated.contents, newContent] };
                }

                if (payload.type === "ticket") {
                  const newContent: MessageContent = {
                    type: "ticket",
                    payload: payload.payload,
                  };
                  return { ...updated, contents: [...updated.contents, newContent] };
                }

                return updated;
              });
            });

            if (payload.type === "message-end") {
              setIsStreaming(false);
              abortRef.current = null;
            }
          },
        });

        setIsStreaming(false);
        abortRef.current = null;
      } catch (cause) {
        if ((cause as DOMException).name === "AbortError") {
          setIsStreaming(false);
          return;
        }
        console.error(cause);
        setIsStreaming(false);
        abortRef.current = null;
        setError("Unable to reach SACCO+ agent. Please try again.");
      }
    },
    [locale, orgId]
  );

  const handleSubmit = useCallback(() => {
    void sendPrompt(input);
  }, [input, sendPrompt]);

  const handleQuickAction = (action: QuickActionKey) => {
    const prompt = quickActionPrompts[action];
    setInput("");
    void sendPrompt(prompt, action);
  };

  const languageControls = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {translations[locale].language}
        </span>
        <div className="flex overflow-hidden rounded-full border border-neutral-200">
          {(["rw", "en", "fr"] as SupportedLocale[]).map((code) => (
            <button
              key={code}
              type="button"
              className={`px-3 py-1 text-xs font-semibold transition-colors duration-interactive ${
                code === locale
                  ? "bg-atlas-blue text-white"
                  : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
              onClick={() => setLocale(code)}
              aria-pressed={code === locale}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    ),
    [locale]
  );

  return (
    <div className="flex h-full min-h-[100vh] flex-col bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-atlas-blue to-atlas-blue-dark text-white">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">{translations[locale].title}</p>
            <p className="text-xs text-neutral-500">{translations[locale].subtitle}</p>
          </div>
        </div>
        {languageControls}
      </header>

      <main className="flex flex-1 flex-col">
        <section className="border-b border-neutral-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
            {(Object.keys(quickActionPrompts) as QuickActionKey[]).map((action) => (
              <button
                key={action}
                type="button"
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-all duration-interactive hover:border-atlas-blue hover:text-atlas-blue focus:outline-none focus:ring-2 focus:ring-atlas-blue/40"
                onClick={() => handleQuickAction(action)}
              >
                {translations[locale][action]}
              </button>
            ))}
          </div>
        </section>

        <div ref={listRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.map((message) => (
              <Message key={message.id} message={message} locale={locale} />
            ))}
            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Composer
        value={input}
        onChange={setInput}
        onSend={handleSubmit}
        onStop={() => {
          abortRef.current?.abort();
          setIsStreaming(false);
        }}
        disabled={isStreaming}
        isStreaming={isStreaming}
        placeholder={translations[locale].placeholder}
        sendLabel={translations[locale].send}
        stopLabel={translations[locale].stop}
      />
    </div>
  );
}
