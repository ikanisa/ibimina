/**
 * Voice Command Button
 * Floating action button for voice commands
 */

import { useState, useEffect } from 'react';
import { Mic, MicOff, Check, X, Loader2 } from 'lucide-react';
import { voiceCommands } from '@/lib/ai';

type VoiceState = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export function VoiceButton() {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(voiceCommands.isSupported());

    if (voiceCommands.isSupported()) {
      voiceCommands.setTranscriptHandler((text) => {
        setTranscript(text);
        setState('listening');
      });

      voiceCommands.setCommandHandler((command, action) => {
        setState('processing');
        setTimeout(() => {
          setState('success');
          setTimeout(() => setState('idle'), 1000);
        }, 500);
      });
    }
  }, []);

  const handleClick = () => {
    if (state === 'idle') {
      voiceCommands.startListening();
      setState('listening');
    } else if (state === 'listening') {
      voiceCommands.stopListening();
      setState('idle');
    }
  };

  if (!isSupported) {
    return null;
  }

  const getButtonColor = () => {
    switch (state) {
      case 'listening':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'processing':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-700 hover:bg-gray-800';
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'listening':
        return <Mic className="w-6 h-6" />;
      case 'processing':
        return <Loader2 className="w-6 h-6 animate-spin" />;
      case 'success':
        return <Check className="w-6 h-6" />;
      case 'error':
        return <X className="w-6 h-6" />;
      default:
        return <MicOff className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Transcript Tooltip */}
      {transcript && state === 'listening' && (
        <div className="absolute bottom-20 right-0 mb-2 w-64 p-3 bg-black/90 backdrop-blur-sm text-white text-sm rounded-xl shadow-2xl animate-in slide-in-from-bottom-2">
          <p className="font-mono">{transcript}</p>
          <div className="absolute bottom-0 right-6 w-3 h-3 bg-black/90 rotate-45 translate-y-1.5" />
        </div>
      )}

      {/* Voice Button */}
      <button
        onClick={handleClick}
        className={`
          relative w-14 h-14 rounded-full text-white shadow-2xl
          transform transition-all duration-200
          hover:scale-110 active:scale-95
          ${getButtonColor()}
          ${state === 'listening' ? 'animate-pulse' : ''}
        `}
        aria-label={state === 'listening' ? 'Stop listening' : 'Start voice commands'}
      >
        {/* Ripple Effect for Listening State */}
        {state === 'listening' && (
          <>
            <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping" />
            <span className="absolute inset-0 rounded-full bg-blue-400 opacity-50 animate-pulse" />
          </>
        )}

        {/* Icon */}
        <span className="relative z-10 flex items-center justify-center">
          {getIcon()}
        </span>
      </button>

      {/* Status Label */}
      <div className="absolute -top-8 right-0 left-0 flex justify-center">
        <span className={`
          px-3 py-1 text-xs font-medium rounded-full
          transition-opacity duration-200
          ${state === 'idle' ? 'opacity-0' : 'opacity-100'}
          ${state === 'listening' ? 'bg-blue-100 text-blue-700' : ''}
          ${state === 'processing' ? 'bg-yellow-100 text-yellow-700' : ''}
          ${state === 'success' ? 'bg-green-100 text-green-700' : ''}
          ${state === 'error' ? 'bg-red-100 text-red-700' : ''}
        `}>
          {state === 'listening' && 'Listening...'}
          {state === 'processing' && 'Processing...'}
          {state === 'success' && 'Done!'}
          {state === 'error' && 'Error'}
        </span>
      </div>
    </div>
  );
}
