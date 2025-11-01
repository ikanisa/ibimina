/**
 * AI Agent API - Search Knowledge Base
 *
 * Endpoint for RAG-based semantic search across org and global knowledge bases
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  KnowledgeBaseResolver,
  OpenAIEmbeddingProvider,
  SupabaseVectorStore,
} from "@ibimina/ai-agent";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, org_id, limit = 5 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured for semantic search" },
        { status: 500 }
      );
    }

    const startedAt = Date.now();
    const resolver = new KnowledgeBaseResolver(
      SupabaseVectorStore.fromClient(supabase),
      new OpenAIEmbeddingProvider({ apiKey }),
      { defaultMatchCount: limit, fallbackLimit: limit }
    );

    const result = await resolver.search(query, {
      orgId: org_id ?? null,
      matchCount: limit,
    });

    const response = {
      query,
      orgId: org_id ?? null,
      source: result.source,
      results: result.matches,
      latencyMs: Date.now() - startedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
