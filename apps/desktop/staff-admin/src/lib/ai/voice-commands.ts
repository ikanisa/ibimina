/**
 * Voice Command System
 * Speech recognition for hands-free navigation and actions
 */

import { createClient } from '@supabase/supabase-js';
import { AI_CONFIG } from '../config/ai-config';
import type { VoiceCommand, SpeechRecognitionResult, VoiceCommandCategory } from './types';

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
  }

  interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}

export class VoiceCommandSystem {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private commands: VoiceCommand[] = [];
  private onTranscript: ((text: string) => void) | null = null;
  private onCommand: ((command: string, action: string) => void) | null = null;
  private isAwake: boolean = false;
  private awakeTimeout: ReturnType<typeof setTimeout> | null = null;
  private supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  constructor() {
    this.initializeSpeechRecognition();
    this.registerDefaultCommands();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechRecognition(): void {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = AI_CONFIG.voiceCommands.continuousListening;
    this.recognition.interimResults = true;
    this.recognition.lang = AI_CONFIG.voiceCommands.languages[0];

    this.recognition.onresult = (event) => {
      const result = event.results[event.resultIndex];
      const transcript = result[0].transcript.toLowerCase().trim();
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      this.onTranscript?.(transcript);

      if (isFinal) {
        this.processTranscript(transcript, confidence);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        this.restartListening();
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this.restartListening();
      }
    };
  }

  /**
   * Register default voice commands
   */
  private registerDefaultCommands(): void {
    // Navigation commands
    this.registerCommand({
      patterns: ['go to dashboard', 'show dashboard', 'open dashboard', 'home'],
      action: () => this.navigate('/dashboard'),
      description: 'Navigate to dashboard',
      category: 'navigation',
    });

    this.registerCommand({
      patterns: ['go to members', 'show members', 'member list'],
      action: () => this.navigate('/members'),
      description: 'Navigate to members',
      category: 'navigation',
    });

    this.registerCommand({
      patterns: ['go to payments', 'show payments', 'payment list'],
      action: () => this.navigate('/payments'),
      description: 'Navigate to payments',
      category: 'navigation',
    });

    this.registerCommand({
      patterns: ['go to groups', 'show groups', 'group list', 'ibimina'],
      action: () => this.navigate('/groups'),
      description: 'Navigate to groups',
      category: 'navigation',
    });

    // Action commands
    this.registerCommand({
      patterns: ['new payment', 'record payment', 'add payment'],
      action: () => this.triggerAction('new-payment'),
      description: 'Create new payment',
      category: 'action',
    });

    this.registerCommand({
      patterns: ['add member', 'new member', 'register member'],
      action: () => this.triggerAction('new-member'),
      description: 'Add new member',
      category: 'action',
    });

    this.registerCommand({
      patterns: ['scan document', 'upload receipt', 'scan receipt'],
      action: () => this.triggerAction('scan-document'),
      description: 'Scan document',
      category: 'action',
    });

    // System commands
    this.registerCommand({
      patterns: ['stop listening', 'stop voice', 'mute', 'be quiet'],
      action: () => this.stopListening(),
      description: 'Stop voice recognition',
      category: 'action',
    });

    this.registerCommand({
      patterns: ['help', 'what can you do', 'commands'],
      action: () => this.showCommands(),
      description: 'Show available commands',
      category: 'query',
    });
  }

  /**
   * Register a new voice command
   */
  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  /**
   * Process recognized transcript
   */
  private async processTranscript(
    transcript: string,
    confidence: number
  ): Promise<void> {
    // Check for wake word
    const wakeWord = AI_CONFIG.voiceCommands.wakeWord.toLowerCase();
    if (!this.isAwake && transcript.includes(wakeWord)) {
      this.wake();
      // Remove wake word from transcript
      transcript = transcript.replace(wakeWord, '').trim();
      if (!transcript) return;
    }

    // Require minimum confidence
    if (!this.isAwake && confidence < AI_CONFIG.voiceCommands.confidenceThreshold) {
      return;
    }

    // Find matching command
    for (const command of this.commands) {
      if (command.enabled === false) continue;

      for (const pattern of command.patterns) {
        if (this.matchesPattern(transcript, pattern)) {
          this.onCommand?.(transcript, command.description);

          // Execute command
          try {
            await command.action({});

            // Log successful command
            await this.logCommand(transcript, command.description, true, confidence);

            this.speak(`Executing: ${command.description}`);
          } catch (error) {
            await this.logCommand(
              transcript,
              command.description,
              false,
              confidence,
              error instanceof Error ? error.message : 'Unknown error'
            );
          }

          return;
        }
      }
    }

    // No command matched
    if (this.isAwake) {
      this.speak("Sorry, I didn't understand that command");
    }
  }

  /**
   * Check if transcript matches command pattern
   */
  private matchesPattern(transcript: string, pattern: string): boolean {
    const transcriptWords = transcript.toLowerCase().split(/\s+/);
    const patternWords = pattern.toLowerCase().split(/\s+/);

    // Fuzzy matching - allow some missing/extra words
    let matchedWords = 0;
    for (const word of patternWords) {
      if (
        transcriptWords.some(
          (tw) => tw === word || this.levenshteinDistance(tw, word) <= 2
        )
      ) {
        matchedWords++;
      }
    }

    return matchedWords >= patternWords.length * AI_CONFIG.voiceCommands.fuzzyMatchThreshold;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b[i - 1] === a[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Activate wake word mode
   */
  private wake(): void {
    this.isAwake = true;
    this.speak("I'm listening");

    // Auto-sleep after configured timeout
    if (this.awakeTimeout) {
      clearTimeout(this.awakeTimeout);
    }

    this.awakeTimeout = setTimeout(() => {
      this.isAwake = false;
      this.speak('Going to sleep');
    }, AI_CONFIG.voiceCommands.awakeTimeoutSeconds * 1000);
  }

  /**
   * Text-to-speech feedback
   */
  private speak(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = AI_CONFIG.voiceCommands.languages[0];
    utterance.rate = 1.1;
    speechSynthesis.speak(utterance);
  }

  /**
   * Start listening for voice commands
   */
  startListening(): void {
    if (!this.recognition) {
      console.warn('Speech recognition not available');
      return;
    }

    this.isListening = true;
    this.recognition.start();
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (!this.recognition) return;

    this.isListening = false;
    this.recognition.stop();
    this.speak('Voice commands disabled');
  }

  /**
   * Restart listening after error
   */
  private restartListening(): void {
    if (this.isListening && this.recognition) {
      setTimeout(() => {
        try {
          this.recognition?.start();
        } catch (e) {
          // Already started
        }
      }, 100);
    }
  }

  /**
   * Set transcript handler
   */
  setTranscriptHandler(handler: (text: string) => void): void {
    this.onTranscript = handler;
  }

  /**
   * Set command handler
   */
  setCommandHandler(handler: (command: string, action: string) => void): void {
    this.onCommand = handler;
  }

  /**
   * Get all registered commands
   */
  getCommands(): VoiceCommand[] {
    return this.commands;
  }

  /**
   * Check if speech recognition is supported
   */
  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Navigate to a route (to be implemented by UI)
   */
  private navigate(path: string): void {
    // Emit custom event that UI can listen to
    window.dispatchEvent(
      new CustomEvent('voice-navigate', { detail: { path } })
    );
  }

  /**
   * Trigger an action (to be implemented by UI)
   */
  private triggerAction(action: string): void {
    window.dispatchEvent(
      new CustomEvent('voice-action', { detail: { action } })
    );
  }

  /**
   * Show available commands
   */
  private showCommands(): void {
    const commandsByCategory = this.commands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<VoiceCommandCategory, VoiceCommand[]>);

    window.dispatchEvent(
      new CustomEvent('voice-show-commands', {
        detail: { commands: commandsByCategory },
      })
    );

    this.speak(`${this.commands.length} commands available`);
  }

  /**
   * Log command execution to database
   */
  private async logCommand(
    transcript: string,
    commandMatched: string,
    success: boolean,
    confidence: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return;

      await this.supabase.from('voice_command_history').insert({
        user_id: user.id,
        transcript,
        command_matched: commandMatched,
        action_taken: commandMatched,
        confidence,
        success,
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Failed to log voice command:', error);
    }
  }

  /**
   * Get voice command history for current user
   */
  async getHistory(limit: number = 50) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await this.supabase
      .from('voice_command_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

// Singleton instance
export const voiceCommands = new VoiceCommandSystem();
