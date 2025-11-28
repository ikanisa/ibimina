import { useState, useCallback } from 'react';
import { DocumentIntelligence } from '@/lib/ai/document-intelligence';

export function useDocumentScanner() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const scanner = new DocumentIntelligence(apiKey || '');

  const scanReceipt = useCallback(async (imageData: Uint8Array) => {
    setScanning(true);
    setError(null);
    try {
      return await scanner.scanMoMoReceipt(imageData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      throw err;
    } finally {
      setScanning(false);
    }
  }, [scanner]);

  const scanID = useCallback(async (imageData: Uint8Array) => {
    setScanning(true);
    setError(null);
    try {
      return await scanner.scanNationalID(imageData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setError(message);
      throw err;
    } finally {
      setScanning(false);
    }
  }, [scanner]);

  const analyzeDocument = useCallback(async (imageData: Uint8Array, mimeType: string) => {
    setScanning(true);
    setError(null);
    try {
      return await scanner.analyzeDocument(imageData, mimeType);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      throw err;
    } finally {
      setScanning(false);
    }
  }, [scanner]);

  const scanDocument = useCallback(async (imageData: Uint8Array, mimeType: string) => {
    return analyzeDocument(imageData, mimeType);
  }, [analyzeDocument]);

  return {
    scanReceipt,
    scanID,
    analyzeDocument,
    scanDocument,
    isScanning: scanning,
    error,
  };
}
