"use client";

import { useState } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface UseLocalAIOptions {
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UseLocalAIReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  generateText: (prompt: string, context?: Record<string, any>) => Promise<{ text: string }>;
}

/**
 * useLocalAI Hook
 *
 * Placeholder hook for AI integration (OpenAI, Gemini, or local models).
 * Replace the mock implementation with actual API calls.
 *
 * @example
 * ```tsx
 * function ChatWidget() {
 *   const { messages, sendMessage, isLoading } = useLocalAI({
 *     model: 'gpt-4',
 *     temperature: 0.7
 *   });
 *   
 *   return (
 *     <div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *       <button onClick={() => sendMessage('Hello')} disabled={isLoading}>
 *         Send
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocalAI(options: UseLocalAIOptions = {}): UseLocalAIReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateText = async (
    prompt: string,
    context?: Record<string, any>
  ): Promise<{ text: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual AI API call
      // Example OpenAI integration:
      // const response = await fetch('https://api.openai.com/v1/chat/completions', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${options.apiKey}`,
      //   },
      //   body: JSON.stringify({
      //     model: options.model || 'gpt-4',
      //     messages: [{ role: 'user', content: prompt }],
      //     temperature: options.temperature || 0.7,
      //     max_tokens: options.maxTokens || 500,
      //   }),
      // });
      // const data = await response.json();
      // return { text: data.choices[0].message.content };

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockResponses = [
        "I can help you with that. Based on your request, here's what I suggest...",
        "That's a great question! Let me provide some insights...",
        "I understand. Here's my analysis of the situation...",
        "Based on the context you provided, I recommend...",
      ];

      const randomResponse =
        mockResponses[Math.floor(Math.random() * mockResponses.length)];

      return {
        text: context
          ? `${randomResponse} (Context: ${Object.keys(context).join(", ")})`
          : randomResponse,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "AI request failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (content: string): Promise<void> => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await generateText(content, {
        previousMessages: messages.slice(-5), // Last 5 messages for context
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get AI response";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    generateText,
  };
}
