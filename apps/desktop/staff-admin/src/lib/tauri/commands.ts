import { invoke } from "@tauri-apps/api/core";

export interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  textScaling: number;
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia";
  cursorSize: "normal" | "large" | "extra-large";
  screenReader: boolean;
  soundEffects: boolean;
  voiceFeedback: boolean;
  keyboardNavigation: boolean;
  stickyKeys: boolean;
  slowKeys: boolean;
  slowKeysDelay: number;
  focusIndicator: "default" | "enhanced" | "high-visibility";
  simplifiedUI: boolean;
  readingGuide: boolean;
  dyslexiaFont: boolean;
  lineSpacing: number;
  wordSpacing: number;
}

export interface VoiceCommand {
  transcript: string;
  commandMatched: string | null;
  actionTaken: string | null;
  confidence: number;
  timestamp: Date;
}

export interface CachedScan {
  scanId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  extractedData: Record<string, unknown>;
  createdAt: Date;
}

export const tauriCommands = {
  accessibility: {
    getSettings: () => invoke<AccessibilitySettings | null>("get_accessibility_settings"),
    saveSettings: (settings: AccessibilitySettings) =>
      invoke("save_accessibility_settings", { settings }),
  },
  voice: {
    getHistory: (limit: number) => invoke<VoiceCommand[]>("get_voice_command_history", { limit }),
    saveCommand: (command: VoiceCommand) => invoke("save_voice_command", { command }),
  },
  documents: {
    getCache: (scanId: string) => invoke<CachedScan | null>("get_document_scan_cache", { scanId }),
    clearCache: () => invoke("clear_document_cache"),
  },
};
