"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Message } from "./Message";
import { Composer } from "./Composer";
import {
  AllocationPayload,
  ChatMessage,
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
    regenerate: "Subiramo",
    ussd: "Intambwe za USSD",
    reference: "Indangamuryango",
    statements: "Raporo",
    ticket: "Fungura itike",
    language: "Ururimi",
    guardrail: "Ntusangize PIN cyangwa ijambobanga. Ntituzigera tubigusaba.",
    blocked: "Ku bw'umutekano, ntutange PIN cyangwa ijambobanga hano.",
    tooLong: "Ubutumwa bwawe ni burebure. Bugabanye mbere yo kubwohereza.",
    wait: "Tegereza ko igisubizo kirangira mbere yo kohereza ubundi butumwa.",
    fallback: "Ntabwo tubashije kugera ku makuru ako kanya. Ongera ugerageze hanyuma gato.",
  },
  en: {
    title: "SACCO+ Support",
    subtitle: "AI assistant for your account",
    placeholder: "Message SACCO+ agent...",
    send: "Send",
    stop: "Stop",
    regenerate: "Regenerate",
    ussd: "USSD steps",
    reference: "My reference",
    statements: "Statements",
    ticket: "Open ticket",
    language: "Language",
    guardrail: "Do not share PINs or passwords. We'll never ask for them.",
    blocked: "For your safety, please don't share passwords or PINs here.",
    tooLong: "Your message is a bit long. Please shorten it before sending.",
    wait: "Please wait for the current response to finish before sending another message.",
    fallback: "I couldn't reach our knowledge base right now. Please try again in a moment.",
  },
  fr: {
    title: "Assistance SACCO+",
    subtitle: "Assistant IA pour votre compte",
    placeholder: "Écrire à l’agent SACCO+...",
    send: "Envoyer",
    stop: "Arrêter",
    regenerate: "Régénérer",
    ussd: "Étapes USSD",
    reference: "Mon identifiant",
    statements: "Relevés",
    ticket: "Ouvrir un ticket",
    language: "Langue",
    guardrail: "Ne partagez jamais vos codes PIN ou mots de passe. Nous ne les demanderons jamais.",
    blocked: "Pour votre sécurité, n'indiquez pas de mot de passe ou de code PIN ici.",
    tooLong: "Votre message est un peu long. Merci de le raccourcir avant l'envoi.",
    wait: "Patientez que la réponse actuelle se termine avant d'envoyer un autre message.",
    fallback: "Je n'ai pas pu accéder aux données pour le moment. Réessayez dans un instant.",
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

const MAX_PROMPT_LENGTH = 1200;
const guardrailPatterns = [
  /\bpin\b/i,
  /\bpassword\b/i,
  /\bpasscode\b/i,
  /code\s+secret/i,
  /ijambobanga/i,
];

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
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const lastPromptRef = useRef<string | null>(null);
  const [sessionMeta, setSessionMeta] = useState<{
    orgName: string | null;
    lang: string;
    hashedIp: string | null;
  } | null>(null);

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
    async (
      rawPrompt: string,
      options?: { quickAction?: QuickActionKey; mode?: "fresh" | "regenerate" }
    ) => {
      const prompt = rawPrompt.trim();
      if (!prompt) return;

      if (isStreaming) {
        setError(translations[locale].wait);
        return;
      }

      if (prompt.length > MAX_PROMPT_LENGTH) {
        setError(translations[locale].tooLong);
        return;
      }

      if (guardrailPatterns.some((pattern) => pattern.test(prompt))) {
        setError(translations[locale].blocked);
        return;
      }

      abortRef.current?.abort();

      const controller = new AbortController();
      abortRef.current = controller;

      const mode = options?.mode ?? "fresh";
      const timestamp = Date.now();
      const assistantMessageId = `assistant-${timestamp}`;

      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        createdAt: timestamp,
        contents: [{ type: "text", text: "", streaming: true }],
      };

      setIsStreaming(true);
      setError(null);

      if (mode === "fresh") {
        const userMessage: ChatMessage = {
          id: `user-${timestamp}`,
          role: "user",
          createdAt: timestamp,
          contents: [{ type: "text", text: prompt }],
        };
        historyRef.current.push({ role: "user", content: prompt });
        setMessages((prev) => [...prev, userMessage, assistantMessage]);
      } else {
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setInput("");

      let finalText = "";
      let completed = false;

      try {
        const response = await fetch("/api/agent/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyRef.current.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            orgId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        await streamSSE({
          response,
          signal: controller.signal,
          onMessage: async ({ event, data }) => {
            if (event === "metadata") {
              const meta = data as {
                org?: { name?: string | null } | null;
                lang?: string;
                ip?: string | null;
              };
              setSessionMeta({
                orgName: meta?.org?.name ?? null,
                lang: meta?.lang ?? locale,
                hashedIp: meta?.ip ?? null,
              });
              return;
            }

            if (event === "token") {
              const token = (data as { text?: string })?.text ?? "";
              if (!token) return;
              finalText += token;
              setMessages((prev) =>
                prev.map((message) => {
                  if (message.id !== assistantMessageId) return message;
                  const next = { ...message, contents: [...message.contents] };
                  let mutated = false;
                  next.contents = next.contents.map((content) => {
                    if (content.type === "text" && !mutated) {
                      mutated = true;
                      return { ...content, text: `${content.text}${token}`, streaming: true };
                    }
                    return content;
                  });
                  if (!mutated) {
                    next.contents.push({ type: "text", text: token, streaming: true });
                  }
                  return next;
                })
              );
              return;
            }

            if (event === "tool_result") {
              const payload = data as {
                id?: string;
                name?: string;
                result?: unknown;
                error?: string;
              };
              const toolId = payload.id ?? crypto.randomUUID();
              const toolName = payload.name ?? "tool";
              const status = payload.error ? "error" : "success";
              const resultData = payload.error ?? payload.result ?? null;

              setMessages((prev) =>
                prev.map((message) => {
                  if (message.id !== assistantMessageId) return message;
                  const updated: ChatMessage = {
                    ...message,
                    contents: [...message.contents],
                  };

                  if (
                    resultData &&
                    typeof resultData === "object" &&
                    "kind" in (resultData as Record<string, unknown>)
                  ) {
                    const typed = resultData as {
                      kind?: string;
                      payload?: unknown;
                    };
                    if (typed.kind === "allocation" && typed.payload) {
                      updated.contents.push({
                        type: "allocation",
                        payload: typed.payload as AllocationPayload,
                      });
                    } else if (typed.kind === "ticket" && typed.payload) {
                      updated.contents.push({
                        type: "ticket",
                        payload: typed.payload as TicketPayload,
                      });
                    }
                  }

                  updated.contents.push({
                    type: "tool-result",
                    payload: {
                      id: toolId,
                      name: toolName,
                      status: status as "success" | "error",
                      data: resultData,
                    },
                  });

                  return updated;
                })
              );
              return;
            }

            if (event === "message") {
              const text = (data as { text?: string })?.text ?? "";
              if (text) {
                finalText = text;
                setMessages((prev) =>
                  prev.map((message) =>
                    message.id === assistantMessageId
                      ? {
                          ...message,
                          contents: message.contents.map((content) =>
                            content.type === "text"
                              ? { ...content, text, streaming: false }
                              : content
                          ),
                        }
                      : message
                  )
                );
              }
              return;
            }

            if (event === "error") {
              const messageText =
                (data as { message?: string })?.message ?? translations[locale].fallback;
              setError(messageText);
              return;
            }

            if (event === "done") {
              const statusValue = (data as { status?: string })?.status ?? "completed";
              completed = statusValue === "completed";
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMessageId
                    ? {
                        ...message,
                        contents: message.contents.map((content) =>
                          content.type === "text" ? { ...content, streaming: false } : content
                        ),
                      }
                    : message
                )
              );
              setIsStreaming(false);
              abortRef.current = null;
            }
          },
        });

        if (completed && finalText.trim()) {
          historyRef.current.push({ role: "assistant", content: finalText });
          lastPromptRef.current = prompt;
        }

        if (!completed) {
          setIsStreaming(false);
          abortRef.current = null;
        }
      } catch (cause) {
        if ((cause as DOMException).name === "AbortError") {
          setIsStreaming(false);
          return;
        }
        console.error(cause);
        setIsStreaming(false);
        abortRef.current = null;
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  contents: message.contents.map((content) =>
                    content.type === "text"
                      ? { ...content, text: translations[locale].fallback, streaming: false }
                      : content
                  ),
                }
              : message
          )
        );
        setError(translations[locale].fallback);
      }
    },
    [orgId, locale, isStreaming]
  );

  const handleSubmit = useCallback(() => {
    void sendPrompt(input);
  }, [input, sendPrompt]);

  const handleQuickAction = useCallback(
    (action: QuickActionKey) => {
      const prompt = quickActionPrompts[action];
      setInput("");
      void sendPrompt(prompt, { quickAction: action });
    },
    [sendPrompt]
  );

  const handleRegenerate = useCallback(() => {
    if (isStreaming) return;
    const lastPrompt = lastPromptRef.current;
    if (!lastPrompt) return;

    setError(null);
    setMessages((prev) => {
      const next = [...prev];
      for (let index = next.length - 1; index >= 0; index -= 1) {
        if (next[index].role === "assistant" && next[index].id !== "welcome") {
          next.splice(index, 1);
          break;
        }
      }
      return next;
    });

    if (
      historyRef.current.length > 0 &&
      historyRef.current[historyRef.current.length - 1]?.role === "assistant"
    ) {
      historyRef.current.pop();
    }

    void sendPrompt(lastPrompt, { mode: "regenerate" });
  }, [isStreaming, sendPrompt]);

  const languageControls = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-700">
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
                  : "bg-white text-neutral-700 hover:bg-neutral-100"
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
            <p className="text-xs text-neutral-700">{translations[locale].subtitle}</p>
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

        {sessionMeta ? (
          <div className="border-b border-neutral-100 bg-neutral-100/70 px-4 py-2">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 text-xs text-neutral-700">
              <span>
                {sessionMeta.orgName ?? "SACCO+"} · {sessionMeta.lang.toUpperCase()}
              </span>
              {sessionMeta.hashedIp ? <span>IP {sessionMeta.hashedIp}</span> : null}
            </div>
          </div>
        ) : null}

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
          abortRef.current = null;
        }}
        onRegenerate={handleRegenerate}
        disabled={isStreaming}
        isStreaming={isStreaming}
        placeholder={translations[locale].placeholder}
        sendLabel={translations[locale].send}
        stopLabel={translations[locale].stop}
        regenerateLabel={translations[locale].regenerate}
        canRegenerate={
          Boolean(lastPromptRef.current) &&
          !isStreaming &&
          messages.some((message) => message.role === "assistant" && message.id !== "welcome")
        }
        footerNote={translations[locale].guardrail}
      />
    </div>
  );
}
