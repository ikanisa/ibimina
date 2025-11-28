/**
 * AI Service - OpenAI Integration
 */

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  text: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export class OpenAIService {
  private apiKey: string;
  private model = 'gpt-4-turbo-preview';
  private baseURL = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateResponse(messages: AIMessage[], context?: Record<string, any>): Promise<AIResponse> {
    const systemMessage: AIMessage = {
      role: 'system',
      content: `You are a helpful AI assistant for Ibimina SACCO in Rwanda. Be concise and helpful.`,
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      usage: data.usage,
    };
  }
}

export function createAIService() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('AI API key not configured');
  return new OpenAIService(apiKey);
}
