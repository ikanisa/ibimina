interface VoiceCommand {
  patterns: string[];
  action: (params: Record<string, string>) => void | Promise<void>;
  description: string;
  category: 'navigation' | 'action' | 'query' | 'ai';
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export class VoiceCommandSystem {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  private commands: VoiceCommand[] = [];
  private onTranscript: ((text: string) => void) | null = null;
  private onCommand: ((command: string, action: string) => void) | null = null;
  private wakeWord: string = 'ibimina';
  private isAwake: boolean = false;
  private awakeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initializeSpeechRecognition();
    this.registerDefaultCommands();
  }

  private initializeSpeechRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-RW';

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
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

  private registerDefaultCommands(): void {
    const emit = (event: string, data?: any) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(event, { detail: data }));
      }
    };

    this.registerCommand({
      patterns: ['go to dashboard', 'show dashboard', 'open dashboard', 'home'],
      action: () => emit('navigate', '/dashboard'),
      description: 'Navigate to dashboard',
      category: 'navigation',
    });

    this.registerCommand({
      patterns: ['go to members', 'show members', 'open members', 'member list'],
      action: () => emit('navigate', '/members'),
      description: 'Navigate to members',
      category: 'navigation',
    });

    this.registerCommand({
      patterns: ['go to payments', 'show payments', 'open payments', 'payment list'],
      action: () => emit('navigate', '/payments'),
      description: 'Navigate to payments',
      category: 'navigation',
    });

    this.registerCommand({
      patterns: ['new payment', 'record payment', 'add payment', 'create payment'],
      action: () => emit('action', { type: 'new-payment' }),
      description: 'Create new payment',
      category: 'action',
    });

    this.registerCommand({
      patterns: ['add member', 'new member', 'register member', 'create member'],
      action: () => emit('action', { type: 'new-member' }),
      description: 'Add new member',
      category: 'action',
    });

    this.registerCommand({
      patterns: ['sync now', 'synchronize', 'refresh data', 'update data'],
      action: () => emit('sync-requested'),
      description: 'Sync data',
      category: 'action',
    });

    this.registerCommand({
      patterns: ['how much collected today', "what's today's collection", 'total collection today'],
      action: () => emit('ai-query', { query: "What's the total collection today?" }),
      description: 'Query today\'s collection',
      category: 'query',
    });

    this.registerCommand({
      patterns: ['pending reconciliation', 'unreconciled payments', 'what needs reconciliation'],
      action: () => emit('ai-query', { query: 'Show me pending reconciliation items' }),
      description: 'Query pending reconciliation',
      category: 'query',
    });

    this.registerCommand({
      patterns: ['hey assistant', 'ask ai', 'help me', 'i need help'],
      action: () => emit('open-ai-panel'),
      description: 'Open AI assistant',
      category: 'ai',
    });

    this.registerCommand({
      patterns: ['stop listening', 'stop voice', 'mute', 'be quiet'],
      action: () => this.stopListening(),
      description: 'Stop voice recognition',
      category: 'action',
    });
  }

  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  private processTranscript(transcript: string, confidence: number): void {
    if (!this.isAwake && transcript.includes(this.wakeWord)) {
      this.wake();
      transcript = transcript.replace(this.wakeWord, '').trim();
      if (!transcript) return;
    }

    if (!this.isAwake && confidence < 0.8) return;

    for (const command of this.commands) {
      for (const pattern of command.patterns) {
        if (this.matchesPattern(transcript, pattern)) {
          this.onCommand?.(transcript, command.description);
          command.action({});
          this.speak(`Executing: ${command.description}`);
          return;
        }
      }
    }

    if (this.isAwake && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ai-query', { 
        detail: { query: transcript, voiceInput: true } 
      }));
    }
  }

  private matchesPattern(transcript: string, pattern: string): boolean {
    const transcriptWords = transcript.toLowerCase().split(/\s+/);
    const patternWords = pattern.toLowerCase().split(/\s+/);

    let matchedWords = 0;
    for (const word of patternWords) {
      if (transcriptWords.some(tw => 
        tw === word || 
        this.levenshteinDistance(tw, word) <= 2
      )) {
        matchedWords++;
      }
    }

    return matchedWords >= patternWords.length * 0.7;
  }

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

  private wake(): void {
    this.isAwake = true;
    this.speak("I'm listening");
    
    if (this.awakeTimeout) {
      clearTimeout(this.awakeTimeout);
    }
    this.awakeTimeout = setTimeout(() => {
      this.isAwake = false;
      this.speak("Going to sleep");
    }, 30000);
  }

  private speak(text: string): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-RW';
    utterance.rate = 1.1;
    speechSynthesis.speak(utterance);
  }

  startListening(): void {
    if (!this.recognition) return;
    this.isListening = true;
    this.recognition.start();
  }

  stopListening(): void {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.stop();
    this.speak("Voice commands disabled");
  }

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

  setTranscriptHandler(handler: (text: string) => void): void {
    this.onTranscript = handler;
  }

  setCommandHandler(handler: (command: string, action: string) => void): void {
    this.onCommand = handler;
  }

  getCommands(): VoiceCommand[] {
    return this.commands;
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
