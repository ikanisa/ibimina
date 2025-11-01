import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

import { env } from "@ibimina/config";
import {
  AIAgent,
  AgentError,
  SupabaseAgentOptOutRegistry,
  SupabaseAgentRateLimiter,
  SupabaseAgentUsageLogger,
} from "@ibimina/ai-agent";
import { createAgentSessionStore } from "@ibimina/providers";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const requestSchema = z.object({
  org_id: z.string().uuid(),
  message: z.string().min(1),
  session_id: z.string().uuid().optional(),
  channel: z.string().min(1).default("web"),
  metadata: z.record(z.any()).optional(),
});

const defaultChannel = "web" as const;

const resolveIpAddress = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const candidate = forwarded.split(",")[0]?.trim();
    if (candidate) {
      return candidate;
    }
  }

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  // @ts-expect-error NextRequest on edge exposes ip
  if (typeof request.ip === "string" && request.ip.length > 0) {
    // @ts-ignore - fallback for Next.js typings
    return request.ip;
  }

  return null;
};

function createSessionStore(client: ReturnType<typeof createSupabaseServiceRoleClient>) {
  if (env.AI_AGENT_SESSION_STORE === "redis") {
    if (!env.AI_AGENT_REDIS_URL) {
      throw new Error("AI_AGENT_REDIS_URL must be set when using redis session store");
    }
    return createAgentSessionStore({
      driver: "redis",
      url: env.AI_AGENT_REDIS_URL,
      ttlSeconds: env.AI_AGENT_SESSION_TTL_SECONDS,
    });
  }

  return createAgentSessionStore({
    driver: "supabase",
    client,
    ttlSeconds: env.AI_AGENT_SESSION_TTL_SECONDS,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "invalid_request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const serviceClient = createSupabaseServiceRoleClient("agent.chat");
    const sessionStore = createSessionStore(serviceClient);

    const usageLogger = new SupabaseAgentUsageLogger({
      client: serviceClient,
      table: env.AI_AGENT_USAGE_LOG_TABLE,
      enabled: env.AI_AGENT_USAGE_LOG_ENABLED,
    });

    const optOutRegistry = new SupabaseAgentOptOutRegistry({
      client: serviceClient,
      table: env.AI_AGENT_OPTOUT_TABLE,
    });

    const rateLimiter = new SupabaseAgentRateLimiter({
      client: serviceClient,
      route: "agent.chat",
      maxHits: env.AI_AGENT_RATE_LIMIT_MAX_REQUESTS,
      windowSeconds: env.AI_AGENT_RATE_LIMIT_WINDOW_SECONDS,
    });

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const agent = new AIAgent({
      model: env.OPENAI_RESPONSES_MODEL,
      sessionStore,
      usageLogger,
      optOutRegistry,
      rateLimiter,
      openai,
      sessionTtlSeconds: env.AI_AGENT_SESSION_TTL_SECONDS,
    });

    const payload = parsed.data;
    const ipAddress = resolveIpAddress(request);

    const response = await agent.chat({
      orgId: payload.org_id,
      userId: user.id,
      sessionId: payload.session_id ?? null,
      message: payload.message,
      channel: payload.channel ?? defaultChannel,
      metadata: payload.metadata ?? {},
      ipAddress,
    });

    return NextResponse.json({
      session_id: response.sessionId,
      message: response.message,
      messages: response.messages,
      usage: response.usage,
      model: response.model,
    });
  } catch (error) {
    if (error instanceof AgentError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          details: error.details ?? null,
        },
        { status: error.status }
      );
    }

    console.error("agent.chat.unhandled_error", error);
    return NextResponse.json(
      { error: "internal_error", message: "Unexpected agent failure" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
