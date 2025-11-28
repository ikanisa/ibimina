/**
 * Gemini AI Client
 * Secure wrapper for Gemini API calls through Supabase Edge Function proxy
 */

import { createClient } from '@supabase/supabase-js';
import { AI_CONFIG, getGeminiProxyUrl } from '../config/ai-config';

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text?: string;
      inline_data?: {
        mime_type: string;
        data: string;
      };
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export class GeminiClient {
  private supabase: ReturnType<typeof createClient>;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Generate content using Gemini API
   */
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    // Client-side rate limiting (additional to server-side)
    this.enforceClientRateLimit();

    // Get session
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new GeminiError('Not authenticated', 401);
    }

    // Make request with retries
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < AI_CONFIG.gemini.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          AI_CONFIG.gemini.timeoutMs
        );

        const response = await fetch(getGeminiProxyUrl(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
            throw new GeminiError(
              'Rate limit exceeded',
              429,
              retryAfter
            );
          }

          if (response.status >= 500 && attempt < AI_CONFIG.gemini.maxRetries - 1) {
            // Retry on server errors with exponential backoff
            await this.delay(Math.pow(2, attempt) * 1000);
            continue;
          }

          throw new GeminiError(
            errorData.error || `Gemini API error: ${response.status}`,
            response.status
          );
        }

        this.requestCount++;
        this.lastRequestTime = Date.now();

        return await response.json();

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on client errors or rate limits
        if (error instanceof GeminiError && error.status && error.status < 500) {
          throw error;
        }

        // Don't retry on abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new GeminiError('Request timeout', 408);
        }

        // Retry on network errors
        if (attempt < AI_CONFIG.gemini.maxRetries - 1) {
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
      }
    }

    throw lastError || new GeminiError('Max retries exceeded');
  }

  /**
   * Stream content (future implementation)
   */
  async streamContent(
    request: GeminiRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    throw new Error('Streaming not yet implemented');
  }

  /**
   * Enforce client-side rate limiting
   */
  private enforceClientRateLimit(): void {
    const now = Date.now();
    const hourAgo = now - 3600000;

    // Reset counter if window passed
    if (this.lastRequestTime < hourAgo) {
      this.requestCount = 0;
    }

    // Check if limit exceeded
    if (this.requestCount >= AI_CONFIG.gemini.rateLimit.requestsPerHour) {
      const resetTime = this.lastRequestTime + 3600000;
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      throw new GeminiError(
        'Client-side rate limit exceeded',
        429,
        retryAfter
      );
    }
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current usage stats (client-side only)
   */
  getUsageStats(): { requestCount: number; resetIn: number } {
    const now = Date.now();
    const resetTime = this.lastRequestTime + 3600000;
    const resetIn = Math.max(0, resetTime - now);

    return {
      requestCount: this.requestCount,
      resetIn: Math.floor(resetIn / 1000),
    };
  }
}

// Singleton instance
export const gemini = new GeminiClient();
