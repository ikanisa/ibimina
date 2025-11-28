import { useState, useEffect, useCallback } from 'react';
import { VoiceCommandSystem } from '@/lib/ai/voice-commands';

export function useVoiceCommands() {
  const [voiceSystem] = useState(() => new VoiceCommandSystem());
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);

  useEffect(() => {
    voiceSystem.setTranscriptHandler(setTranscript);
    voiceSystem.setCommandHandler((command, action) => {
      setLastCommand(action);
    });
  }, [voiceSystem]);

  const startListening = useCallback(() => {
    voiceSystem.startListening();
    setIsListening(true);
  }, [voiceSystem]);

  const stopListening = useCallback(() => {
    voiceSystem.stopListening();
    setIsListening(false);
  }, [voiceSystem]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    startListening,
    stopListening,
    toggleListening,
    isListening,
    transcript,
    lastCommand,
    isSupported: voiceSystem.isSupported(),
    commands: voiceSystem.getCommands(),
  };
}
