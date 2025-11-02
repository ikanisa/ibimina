import OpenAI from "openai";
import type { EmbeddingProvider } from "./types.js";

export interface OpenAIEmbeddingConfig {
  apiKey: string;
  model?: string;
}

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;

  constructor(config: OpenAIEmbeddingConfig) {
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required to build embeddings");
    }

    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model ?? "text-embedding-3-small";
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!texts.length) {
      return [];
    }

    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });

    return response.data.map((item) => [...item.embedding]);
  }
}
