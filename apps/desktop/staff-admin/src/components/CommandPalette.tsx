import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command } from 'cmdk';
import { 
  Search, 
  User, 
  Users, 
  FileText, 
  Settings, 
  ArrowRight,
  Sparkles,
  Calculator,
  CreditCard,
  TrendingUp,
  CheckCircle,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type CommandMode = 'search' | 'ai' | 'calculate' | 'navigate';

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<CommandMode>('search');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Detect mode from query prefix
  useEffect(() => {
    if (query.startsWith('/ai ') || query.startsWith('? ')) {
      setMode('ai');
    } else if (query.startsWith('=')) {
      setMode('calculate');
    } else if (query.startsWith('>')) {
      setMode('navigate');
    } else {
      setMode('search');
    }
  }, [query]);

  // Handle AI queries (mock implementation)
  const handleAIQuery = useCallback(async () => {
    const aiQuery = query.replace(/^(\/ai\s*|\? )/, '').trim();
    if (!aiQuery) return;

    setIsLoading(true);
    setAiResponse('');

    // Simulate AI response
    setTimeout(() => {
      setAiResponse(`This is a simulated AI response to: "${aiQuery}". Connect to Gemini API for real responses.`);
      setIsLoading(false);
    }, 1000);
  }, [query]);

  // Calculate expression
  const calculationResult = useMemo(() => {
    if (mode !== 'calculate') return null;
    const expression = query.slice(1).trim();
    try {
      const result = new Function(`return ${expression}`)();
      return typeof result === 'number' ? result.toLocaleString() : null;
    } catch {
      return null;
    }
  }, [query, mode]);

  // Navigation commands
  const navigationCommands = useMemo(() => [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, path: '/dashboard' },
    { id: 'members', label: 'Members', icon: Users, path: '/members' },
    { id: 'payments', label: 'Payments', icon: CreditCard, path: '/payments' },
    { id: 'reconciliation', label: 'Reconciliation', icon: CheckCircle, path: '/recon' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
    { id: 'ikimina', label: 'Ikimina Groups', icon: Users, path: '/ikimina' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ], []);

  // Quick actions
  const actions = useMemo(() => [
    { 
      id: 'new-payment', 
      label: 'Record New Payment', 
      icon: CreditCard, 
      shortcut: '⌘N',
      action: () => navigate('/payments/new'),
    },
    { 
      id: 'add-member', 
      label: 'Add New Member', 
      icon: User, 
      shortcut: '⌘⇧M',
      action: () => navigate('/members/new'),
    },
    { 
      id: 'reconcile', 
      label: 'Start Reconciliation', 
      icon: CheckCircle, 
      shortcut: '⌘R',
      action: () => navigate('/recon/new'),
    },
    { 
      id: 'generate-report', 
      label: 'Generate Report', 
      icon: FileText, 
      shortcut: '⌘⇧R',
      action: () => navigate('/reports/generate'),
    },
    { 
      id: 'ai-insights', 
      label: 'AI Insights', 
      icon: Sparkles, 
      shortcut: '⌘⇧A',
      action: () => setMode('ai'),
    },
  ], [navigate]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-commandPalette"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-commandPalette px-4"
          >
            <Command
              className="bg-surface-elevated border border-border-default rounded-2xl shadow-2xl overflow-hidden"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default">
                {mode === 'ai' ? (
                  <Sparkles className="w-5 h-5 text-primary-500 animate-pulse" />
                ) : mode === 'calculate' ? (
                  <Calculator className="w-5 h-5 text-accent-500" />
                ) : (
                  <Search className="w-5 h-5 text-text-muted" />
                )}
                <Command.Input
                  value={query}
                  onValueChange={setQuery}
                  placeholder={
                    mode === 'ai' 
                      ? "Ask me anything about your SACCO..." 
                      : "Search members, payments, actions... (type ? for AI)"
                  }
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-body-md"
                  autoFocus
                />
                {mode === 'ai' && (
                  <button
                    onClick={handleAIQuery}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 transition-fast"
                  >
                    {isLoading ? 'Thinking...' : 'Ask AI'}
                  </button>
                )}
                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-surface-overlay rounded text-xs text-text-muted">
                  ESC
                </kbd>
              </div>

              {/* AI Response */}
              {mode === 'ai' && aiResponse && (
                <div className="px-4 py-3 border-b border-border-default bg-primary-50 dark:bg-primary-950/30">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 text-body-md text-text-primary">
                      {aiResponse}
                    </div>
                  </div>
                </div>
              )}

              {/* Calculator Result */}
              {mode === 'calculate' && calculationResult && (
                <div className="px-4 py-3 border-b border-border-default bg-accent-50 dark:bg-accent-950/30">
                  <div className="flex items-center gap-3">
                    <span className="text-display-md font-bold text-accent-600 dark:text-accent-400">
                      = {calculationResult}
                    </span>
                  </div>
                </div>
              )}

              {/* Command List */}
              <Command.List className="max-h-80 overflow-auto p-2">
                <Command.Empty className="py-6 text-center text-text-muted text-body-sm">
                  No results found.
                </Command.Empty>

                {/* Quick Actions */}
                {mode === 'search' && !query && (
                  <Command.Group heading="Quick Actions" className="px-2 py-1.5 text-xs font-semibold text-text-muted">
                    {actions.map((action) => (
                      <Command.Item
                        key={action.id}
                        value={action.label}
                        onSelect={() => {
                          action.action();
                          onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface-overlay aria-selected:bg-surface-overlay transition-fast text-body-md"
                      >
                        <action.icon className="w-4 h-4 text-text-muted" />
                        <span className="flex-1">{action.label}</span>
                        <kbd className="px-1.5 py-0.5 bg-surface-overlay rounded text-xs text-text-muted font-mono">
                          {action.shortcut}
                        </kbd>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Navigation */}
                {(mode === 'search' || mode === 'navigate') && (
                  <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-semibold text-text-muted mt-2">
                    {navigationCommands.map((cmd) => (
                      <Command.Item
                        key={cmd.id}
                        value={cmd.label}
                        onSelect={() => {
                          navigate(cmd.path);
                          onClose();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface-overlay aria-selected:bg-surface-overlay transition-fast text-body-md"
                      >
                        <cmd.icon className="w-4 h-4 text-text-muted" />
                        <span className="flex-1">{cmd.label}</span>
                        <ArrowRight className="w-4 h-4 text-text-muted" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* AI Suggestions */}
                {mode === 'ai' && !aiResponse && (
                  <Command.Group heading="AI Suggestions" className="px-2 py-1.5 text-xs font-semibold text-text-muted">
                    {[
                      "What's the total collection this month?",
                      "Show me members with overdue payments",
                      "Summarize reconciliation status",
                      "Which ikimina groups need attention?",
                      "Generate a collection forecast for next week",
                    ].map((suggestion, i) => (
                      <Command.Item
                        key={i}
                        value={suggestion}
                        onSelect={() => {
                          setQuery(`? ${suggestion}`);
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-surface-overlay aria-selected:bg-surface-overlay transition-fast text-body-sm"
                      >
                        <Sparkles className="w-4 h-4 text-primary-500" />
                        <span>{suggestion}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-border-default bg-surface-overlay/50 text-xs text-text-muted">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-surface-overlay rounded font-mono">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-surface-overlay rounded font-mono">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 bg-surface-overlay rounded font-mono">?</kbd>
                    AI Mode
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Powered by Gemini
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
