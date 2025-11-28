/**
 * AI Services
 * Centralized exports for all AI-powered features
 */

// Core services
export { gemini, GeminiClient, GeminiError } from './gemini-client';
export { documentIntelligence, DocumentIntelligence } from './document-intelligence';
export { fraudDetection, FraudDetectionEngine } from './fraud-detection';
export { voiceCommands, VoiceCommandSystem } from './voice-commands';

// Types
export type {
  // Document Intelligence
  DocumentType,
  DocumentAnalysisResult,
  ReceiptData,
  IDCardData,
  BankStatementData,
  
  // Fraud Detection
  FraudSeverity,
  FraudType,
  FraudAlert,
  Transaction,
  MemberFraudProfile,
  
  // Voice Commands
  VoiceCommand,
  VoiceCommandCategory,
  SpeechRecognitionResult,
  VoiceCommandHistory,
  
  // Utility
  ProcessingResult,
  BatchProcessingResult,
  
  // Database
  DBDocumentScan,
  DBFraudAlert,
  DBMemberFraudProfile,
  DBVoiceCommandHistory,
} from './types';

// Configuration
export { AI_CONFIG, AI_FEATURE_FLAGS, isFeatureEnabled } from '../config/ai-config';
