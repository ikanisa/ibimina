/**
 * Voice Transcript Display
 * Shows live speech recognition transcript
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceTranscriptProps {
  transcript: string;
  isFinal: boolean;
  isVisible: boolean;
}

export function VoiceTranscript({ transcript, isFinal, isVisible }: VoiceTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!isVisible || !transcript) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-24 right-6 w-80 max-h-48 z-40"
      >
        <div className="bg-black/90 backdrop-blur-xl text-white rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          {/* Header */}
          <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse delay-75" />
              <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse delay-150" />
            </div>
            <span className="text-xs font-medium text-white/70">Listening...</span>
          </div>

          {/* Transcript */}
          <div 
            ref={scrollRef}
            className="px-4 py-3 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          >
            <p className={`font-mono text-sm leading-relaxed ${isFinal ? 'text-white' : 'text-white/60'}`}>
              {transcript}
              {!isFinal && <span className="inline-block w-2 h-4 ml-1 bg-white/60 animate-pulse" />}
            </p>
          </div>
        </div>

        {/* Pointer */}
        <div className="absolute bottom-0 right-6 w-4 h-4 bg-black/90 rotate-45 translate-y-2" />
      </motion.div>
    </AnimatePresence>
  );
}
