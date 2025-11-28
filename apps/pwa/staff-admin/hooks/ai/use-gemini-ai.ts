import { useState, useCallback } from 'react';

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export function useGeminiAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const streamMessage = useCallback(async (
    prompt: string,
    onChunk: (text: string) => void
  ): Promise<void> => {
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${GEMINI_API}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      onChunk(text);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  const generateText = useCallback(async (prompt: string): Promise<string> => {
    let result = '';
    await streamMessage(prompt, (text) => { result = text; });
    return result;
  }, [streamMessage]);

  return {
    streamMessage,
    generateText,
    loading,
    error,
  };
}
