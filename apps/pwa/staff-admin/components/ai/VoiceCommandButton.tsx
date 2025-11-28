import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { useVoiceCommands } from '@/hooks/ai/use-voice-commands';

interface VoiceCommandButtonProps {
  onCommand?: (command: string, action: string) => void;
  onTranscript?: (text: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function VoiceCommandButton({
  onCommand,
  onTranscript,
  className = '',
  size = 'md',
}: VoiceCommandButtonProps) {
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    lastCommand,
  } = useVoiceCommands();

  const [showTranscript, setShowTranscript] = useState(false);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  useEffect(() => {
    if (transcript) {
      onTranscript?.(transcript);
      setShowTranscript(true);
      const timeout = setTimeout(() => setShowTranscript(false), 3000);
      return () => clearTimeout(timeout);
    }
  }, [transcript, onTranscript]);

  useEffect(() => {
    if (lastCommand) {
      onCommand?.(lastCommand.command, lastCommand.action);
      setRecentCommands(prev => [lastCommand.action, ...prev.slice(0, 4)]);
    }
  }, [lastCommand, onCommand]);

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-warning-500/10 border border-warning-500/20 rounded-lg">
        <MicOff className="w-4 h-4 text-warning-600" />
        <span className="text-sm text-warning-700">Voice not supported</span>
      </div>
    );
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Button */}
      <motion.button
        onClick={handleToggle}
        className={`
          ${sizeClasses[size]}
          relative rounded-full flex items-center justify-center
          transition-all duration-300
          ${isListening 
            ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/50' 
            : 'bg-surface-elevated border-2 border-border-default text-text-muted hover:bg-surface-subtle hover:border-primary-500/50'
          }
        `}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        {/* Pulse Animation */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full bg-primary-500"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-accent-500"
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.3, 0, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.5,
              }}
            />
          </>
        )}

        {/* Icon */}
        <div className="relative z-10">
          {isListening ? (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Mic className={iconSizes[size]} />
            </motion.div>
          ) : (
            <Mic className={iconSizes[size]} />
          )}
        </div>

        {/* Active Indicator */}
        {isListening && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Transcript Popup */}
      <AnimatePresence>
        {showTranscript && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50"
          >
            <div className="bg-surface-elevated border border-border-default rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-text-muted mb-1">You said:</p>
                  <p className="text-sm text-text-primary font-medium">{transcript}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Commands */}
      {recentCommands.length > 0 && isListening && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-full mr-4 top-0 w-64 bg-surface-elevated border border-border-default rounded-lg shadow-lg p-3"
        >
          <h4 className="text-xs font-semibold text-text-muted mb-2">Recent Commands</h4>
          <ul className="space-y-1">
            {recentCommands.map((cmd, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-sm text-text-secondary flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-success-500" />
                {cmd}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Status Indicator */}
      {isListening && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-elevated border border-border-default rounded-full text-xs">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-text-muted">Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Floating Action Button variant
export function VoiceCommandFAB({
  onCommand,
  onTranscript,
}: Pick<VoiceCommandButtonProps, 'onCommand' | 'onTranscript'>) {
  const { isListening, startListening, stopListening } = useVoiceCommands();

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <VoiceCommandButton
        size="lg"
        onCommand={onCommand}
        onTranscript={onTranscript}
        className="shadow-2xl"
      />

      {/* Hint */}
      {!isListening && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute -top-12 right-0 bg-surface-elevated border border-border-default rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
        >
          <p className="text-xs text-text-muted">
            Say "Ibimina" to wake
          </p>
          <div className="absolute -bottom-1 right-6 w-2 h-2 bg-surface-elevated border-r border-b border-border-default transform rotate-45" />
        </motion.div>
      )}
    </motion.div>
  );
}
