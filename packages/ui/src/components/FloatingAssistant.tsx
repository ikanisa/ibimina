"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useDragControls, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Mic, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "../utils/cn";
import { useLocalAI } from "../hooks/useLocalAI";
import type { Message } from "../hooks/useLocalAI";

export interface FloatingAssistantProps {
  defaultOpen?: boolean;
  defaultPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

/**
 * FloatingAssistant Component
 *
 * Draggable AI chat widget with minimize/maximize states.
 * Features message history, voice input support, and persistent position.
 *
 * @example
 * ```tsx
 * function App() {
 *   const [position, setPosition] = useState({ x: 20, y: 20 });
 *   
 *   return (
 *     <>
 *       <YourContent />
 *       <FloatingAssistant
 *         defaultOpen={false}
 *         defaultPosition={position}
 *         onPositionChange={setPosition}
 *         suggestions={['Summarize this page', 'Create a task']}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function FloatingAssistant({
  defaultOpen = false,
  defaultPosition = { x: 20, y: 20 },
  onPositionChange,
  placeholder = "Ask me anything...",
  suggestions = [],
  className,
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  
  const dragControls = useDragControls();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isLoading, error, sendMessage, clearMessages } = useLocalAI({
    model: "gpt-4",
    temperature: 0.7,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const messageContent = input;
    setInput("");
    await sendMessage(messageContent);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  // Toggle voice input (placeholder - requires Web Speech API)
  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    // TODO: Implement actual voice input
    // if ('webkitSpeechRecognition' in window) {
    //   const recognition = new webkitSpeechRecognition();
    //   recognition.onresult = (event) => {
    //     setInput(event.results[0][0].transcript);
    //   };
    //   recognition.start();
    // }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              "fixed bottom-6 right-6 w-14 h-14 rounded-full",
              "bg-primary text-primary-foreground shadow-lg shadow-primary/25",
              "flex items-center justify-center hover:scale-110 transition-transform z-50",
              className
            )}
            aria-label="Open AI Assistant"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? 56 : 480,
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{
              left: 0,
              right: typeof window !== "undefined" ? window.innerWidth - 384 : 0,
              top: 0,
              bottom: typeof window !== "undefined" ? window.innerHeight - (isMinimized ? 56 : 480) : 0,
            }}
            onDragEnd={(_, info) => {
              onPositionChange?.({ x: info.point.x, y: info.point.y });
            }}
            style={{
              position: "fixed",
              bottom: defaultPosition.y,
              right: defaultPosition.x,
              width: 384,
            }}
            className={cn(
              "bg-background border border-neutral-200 dark:border-neutral-800",
              "rounded-2xl shadow-2xl overflow-hidden z-50",
              className
            )}
          >
            {/* Header - Draggable */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className={cn(
                "h-14 px-4 border-b border-neutral-200 dark:border-neutral-800",
                "flex items-center justify-between cursor-grab active:cursor-grabbing",
                "bg-muted/30"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="h-[340px] overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-primary/50 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm mb-4">
                        Hi! I'm your AI assistant. How can I help you today?
                      </p>
                      {suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {suggestions.slice(0, 3).map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))
                  )}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                      </div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="h-[70px] px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder={placeholder}
                      disabled={isLoading}
                      className={cn(
                        "flex-1 bg-background border border-neutral-300 dark:border-neutral-700",
                        "rounded-lg px-4 py-2 text-sm",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    />
                    <button
                      onClick={toggleVoiceInput}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        isListening
                          ? "bg-red-500 text-white"
                          : "hover:bg-muted text-muted-foreground"
                      )}
                      aria-label="Voice input"
                      title="Voice input (coming soon)"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "p-2 rounded-lg bg-primary text-primary-foreground",
                        "disabled:opacity-50 hover:bg-primary/90 transition-colors"
                      )}
                      aria-label="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}
