import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, MessageSquare, Send, Lightbulb } from 'lucide-react';

interface AIAssistantPanelProps {
  onClose: () => void;
  tab: 'ai' | 'notifications' | 'activity';
  onTabChange: (tab: 'ai' | 'notifications' | 'activity') => void;
}

export function AIAssistantPanel({ onClose, tab, onTabChange }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with SACCO operations, data insights, and answer questions about members, payments, and groups.'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { role: 'user', content: input },
      { role: 'assistant', content: 'This is a simulated AI response. Connect to Gemini API for real responses.' }
    ]);
    setInput('');
  };

  const suggestions = [
    "Total collections this month",
    "Members with overdue payments",
    "Top performing groups",
    "Reconciliation summary"
  ];

  return (
    <div className="h-full flex flex-col bg-surface-base">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h2 className="text-h4 font-semibold">AI Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-surface-overlay rounded transition-fast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/30 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl text-body-sm ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-elevated border border-border-default text-text-primary'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-xs text-text-muted px-2">Try asking:</p>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInput(suggestion)}
                className="w-full flex items-center gap-2 p-3 bg-surface-elevated border border-border-default rounded-lg hover:bg-surface-overlay transition-fast text-left text-body-sm"
              >
                <Lightbulb className="w-4 h-4 text-accent-500 flex-shrink-0" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-default">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me anything..."
            rows={2}
            className="flex-1 px-3 py-2 bg-surface-overlay border border-border-default rounded-lg text-body-sm resize-none focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-fast"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-fast"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Press <kbd className="px-1 bg-surface-overlay rounded font-mono">⏎</kbd> to send, <kbd className="px-1 bg-surface-overlay rounded font-mono">⇧⏎</kbd> for new line
        </p>
      </div>
    </div>
  );
}
