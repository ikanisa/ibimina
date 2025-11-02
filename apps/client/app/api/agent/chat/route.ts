import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo, withLogContext, updateLogContext } from "@/lib/observability/logger";
import { enforceRateLimit, hashRateLimitKey } from "@/lib/rate-limit";
import { executeTool, getToolDefinitions } from "@/lib/agent/tools";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const SUPABASE_FACTORY_TOKEN = Symbol.for("ibimina.client.agent.supabase_factory");
const OPENAI_FETCH_TOKEN = Symbol.for("ibimina.client.agent.openai_fetch");

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1),
  orgId: z.string().uuid().optional(),
});

const OPENAI_BASE_URL = process.env.OPENAI_RESPONSES_URL ?? "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.OPENAI_RESPONSES_MODEL ?? "gpt-4.1-mini";

interface UserContext {
  lang: string;
  profile: {
    whatsapp_msisdn: string | null;
    momo_msisdn: string | null;
  } | null;
  org: {
    id: string | null;
    name: string | null;
    country: string;
  };
}

interface ToolCall {
  id: string;
  type: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

interface StreamState {
  text: string;
  responseId: string | null;
}

const getFetchImpl = () =>
  (globalThis as unknown as { [OPENAI_FETCH_TOKEN]?: typeof fetch })[OPENAI_FETCH_TOKEN] ?? fetch;

const resolveSupabaseClient = () => {
  const override = (
    globalThis as unknown as { [SUPABASE_FACTORY_TOKEN]?: (() => Promise<SupabaseClient>) | null }
  )[SUPABASE_FACTORY_TOKEN];
  if (override) {
    return override();
  }
  return createSupabaseServerClient();
};

const getRequestIp = (request: NextRequest) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [first] = forwarded.split(",");
    if (first) {
      return first.trim();
    }
  }
  const realIp = request.headers.get("x-real-ip");
  return realIp ? realIp.trim() : null;
};

const createSseStream = (signal: AbortSignal | undefined) => {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;
  const queue: Uint8Array[] = [];

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      for (const chunk of queue.splice(0)) {
        ctrl.enqueue(chunk);
      }
      if (signal) {
        signal.addEventListener(
          "abort",
          () => {
            if (!closed) {
              closed = true;
              ctrl.close();
            }
          },
          { once: true }
        );
      }
    },
    cancel() {
      closed = true;
    },
  });

  const write = async (event: string, data: unknown) => {
    if (closed) return;
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    const serialized = encoder.encode(`event: ${event}\ndata: ${payload}\n\n`);
    if (controller) {
      controller.enqueue(serialized);
    } else {
      queue.push(serialized);
    }
  };

  const close = () => {
    if (!closed) {
      closed = true;
      controller?.close();
    }
  };

  return { stream, write, close } as const;
};

const fetchUserContext = async (supabase: SupabaseClient, userId: string): Promise<UserContext> => {
  const client = supabase as unknown as Record<string, unknown>;
  const from = client.from as unknown as (table: string) => {
    select: (columns: string) => unknown;
  };

  const profileBuilder = from("members_app_profiles")
    .select("lang, whatsapp_msisdn, momo_msisdn")
    .eq("user_id", userId);
  const profileResult =
    typeof profileBuilder.maybeSingle === "function"
      ? await profileBuilder.maybeSingle()
      : await profileBuilder.single();

  if (profileResult.error) {
    throw profileResult.error instanceof Error
      ? profileResult.error
      : new Error("profile_lookup_failed");
  }

  const profileData = profileResult.data as Record<string, unknown> | null;

  let orgBuilder = from("user_saccos")
    .select("sacco_id, saccos(name, metadata)")
    .eq("user_id", userId);

  if (typeof orgBuilder.order === "function") {
    orgBuilder = orgBuilder.order("created_at", { ascending: true });
  }

  if (typeof orgBuilder.limit === "function") {
    orgBuilder = orgBuilder.limit(1);
  }

  const orgResult =
    typeof orgBuilder.maybeSingle === "function"
      ? await orgBuilder.maybeSingle()
      : typeof orgBuilder.single === "function"
        ? await orgBuilder.single()
        : { data: null, error: null };

  if (orgResult.error) {
    throw orgResult.error instanceof Error ? orgResult.error : new Error("org_lookup_failed");
  }

  const saccoRecord = orgResult.data as
    | {
        sacco_id?: string | null;
        saccos?: { name?: string | null; metadata?: Record<string, unknown> | null } | null;
      }
    | null
    | undefined;

  const metadata = saccoRecord?.saccos?.metadata ?? {};
  const country =
    (typeof metadata === "object" &&
      metadata &&
      ("country_code" in metadata
        ? String((metadata as Record<string, unknown>).country_code)
        : null)) ||
    (typeof metadata === "object" &&
      metadata &&
      ("country" in metadata ? String((metadata as Record<string, unknown>).country) : null)) ||
    "RW";

  return {
    lang: (profileData?.lang as string | null) ?? "en",
    profile: profileData
      ? {
          whatsapp_msisdn: (profileData?.whatsapp_msisdn as string | null) ?? null,
          momo_msisdn: (profileData?.momo_msisdn as string | null) ?? null,
        }
      : null,
    org: {
      id: (saccoRecord?.sacco_id as string | null) ?? null,
      name: saccoRecord?.saccos?.name ?? null,
      country,
    },
  } satisfies UserContext;
};

const parseOpenAiEvents = async (
  response: Response,
  state: StreamState,
  emit: (event: string, data: unknown) => Promise<void>
): Promise<{ status: "completed" } | { status: "requires_action"; toolCalls: ToolCall[] }> => {
  if (!response.body) {
    throw new Error("OpenAI streaming response missing body");
  }

  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
    }

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("");

      if (!dataLines || dataLines === "[DONE]") {
        continue;
      }

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(dataLines) as Record<string, unknown>;
      } catch (error) {
        await emit("error", { message: "Failed to parse OpenAI event" });
        throw error instanceof Error ? error : new Error("openai_parse_error");
      }

      const type = payload.type as string | undefined;
      if (type === "response.created" || type === "response.in_progress") {
        const responseId = (payload.response as { id?: string } | undefined)?.id ?? null;
        if (responseId) {
          state.responseId = responseId;
        }
        continue;
      }

      if (type === "response.output_text.delta") {
        const delta = (payload.delta as { text?: string } | undefined)?.text ?? "";
        if (delta) {
          state.text += delta;
          await emit("token", { text: delta });
        }
        continue;
      }

      if (type === "response.output_text.done") {
        const responsePayload = payload.response as {
          output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
        };
        const outputText =
          responsePayload?.output
            ?.flatMap((entry) => entry.content ?? [])
            .filter((block) => block.type === "output_text")
            .map((block) => block.text ?? "")
            .join("") ?? "";
        if (outputText && !state.text) {
          state.text = outputText;
        }
        continue;
      }

      if (type === "response.required_action") {
        const toolCalls = (
          payload.required_action as
            | { submit_tool_outputs?: { tool_calls?: ToolCall[] } }
            | undefined
        )?.submit_tool_outputs?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          return { status: "requires_action", toolCalls };
        }
        continue;
      }

      if (type === "response.error") {
        const error = payload.error as { message?: string } | undefined;
        throw new Error(error?.message ?? "OpenAI response error");
      }
    }
  }

  return { status: "completed" };
};

const callOpenAi = async (url: string, body: Record<string, unknown>) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const fetchImpl = getFetchImpl();
  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${errorText.slice(0, 200)}`);
  }

  return response;
};

const runAgentConversation = async (
  payload: Record<string, unknown>,
  context: { supabase: SupabaseClient; user: { id: string }; userContext: UserContext },
  emit: (event: string, data: unknown) => Promise<void>
) => {
  const state: StreamState = { text: "", responseId: null };

  let endpoint = OPENAI_BASE_URL;
  let body: Record<string, unknown> | null = payload;

  while (body) {
    const response = await callOpenAi(endpoint, body);
    const result = await parseOpenAiEvents(response, state, emit);

    if (result.status === "requires_action") {
      const toolOutputs = [] as Array<{ tool_call_id: string; output: string }>;
      for (const call of result.toolCalls) {
        const toolName = call.function?.name;
        const toolId = call.id;
        if (!toolName || !toolId) {
          await emit("tool_result", {
            id: toolId ?? "unknown",
            name: toolName ?? "unknown",
            error: "Invalid tool call payload",
          });
          continue;
        }

        let args: Record<string, unknown> = {};
        if (call.function?.arguments) {
          try {
            args = JSON.parse(call.function.arguments) as Record<string, unknown>;
          } catch {
            await emit("tool_result", {
              id: toolId,
              name: toolName,
              error: "Failed to parse tool arguments",
            });
            continue;
          }
        }

        try {
          const resultData = await executeTool(toolName, args, {
            supabase: context.supabase,
            userId: context.user.id,
            orgId: context.userContext.org.id,
            lang: context.userContext.lang,
          });
          await emit("tool_result", { id: toolId, name: toolName, result: resultData });
          toolOutputs.push({ tool_call_id: toolId, output: JSON.stringify(resultData) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Tool execution failed";
          await emit("tool_result", { id: toolId, name: toolName, error: message });
          toolOutputs.push({ tool_call_id: toolId, output: JSON.stringify({ error: message }) });
        }
      }

      if (!state.responseId) {
        throw new Error("Missing response id for tool submission");
      }

      endpoint = `${OPENAI_BASE_URL}/${state.responseId}/tool_outputs`;
      body = {
        tool_outputs: toolOutputs,
        stream: true,
      };
      continue;
    }

    body = null;
  }

  return state.text;
};

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  return withLogContext({ requestId, source: "client-agent-chat" }, async () => {
    try {
      const rawBody = await request.json();
      const parsed = requestSchema.safeParse(rawBody);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: "invalid_request" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }

      const supabase = await resolveSupabaseClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        });
      }

      updateLogContext({ userId: user.id });

      const userContext = await fetchUserContext(supabase, user.id);
      if (userContext.org.id) {
        updateLogContext({ orgId: userContext.org.id });
      }

      const ip = getRequestIp(request);
      try {
        if (ip) {
          await enforceRateLimit(hashRateLimitKey("agent", "ip", ip), {
            maxHits: 30,
            windowSeconds: 60,
          });
        }
        await enforceRateLimit(hashRateLimitKey("agent", "user", user.id), {
          maxHits: 40,
          windowSeconds: 60,
        });
        if (userContext.org.id) {
          await enforceRateLimit(hashRateLimitKey("agent", "org", userContext.org.id), {
            maxHits: 80,
            windowSeconds: 60,
          });
        }
      } catch (error) {
        if (error instanceof Error && error.message === "rate_limit_exceeded") {
          return new Response(JSON.stringify({ error: "rate_limited" }), {
            status: 429,
            headers: { "content-type": "application/json" },
          });
        }
        throw error;
      }

      const { stream, write, close } = createSseStream(request.signal);

      const response = new Response(stream, {
        headers: {
          "content-type": "text/event-stream",
          "cache-control": "no-cache, no-transform",
          connection: "keep-alive",
        },
      });

      queueMicrotask(() => {
        (async () => {
          try {
            await write("metadata", {
              org: userContext.org,
              lang: userContext.lang,
              ip: ip ? hashRateLimitKey("agent", "ip", ip).slice(0, 12) : null,
            });

            const systemPrompt = `You are the Ibimina SACCO+ member support assistant. The member prefers the language \"${userContext.lang}\" and belongs to organisation ${
              userContext.org.name ?? "Unknown"
            }. Provide factual answers using available tools when necessary.`;

            const inputMessages = [
              {
                role: "system",
                content: [{ type: "input_text", text: systemPrompt }],
              },
              ...parsed.data.messages.map((message) => ({
                role: message.role,
                content: [{ type: "input_text", text: message.content }],
              })),
            ];

            const payload = {
              model: OPENAI_MODEL,
              input: inputMessages,
              stream: true,
              tools: getToolDefinitions(),
              tool_choice: "auto",
              metadata: {
                user_id: user.id,
                org_id: userContext.org.id,
                country: userContext.org.country,
                lang: userContext.lang,
              },
            } satisfies Record<string, unknown>;

            const finalText = await runAgentConversation(
              payload,
              { supabase, user, userContext },
              write
            );

            await write("message", { text: finalText });
            await write("done", { status: "completed" });
            logInfo("agent_chat_completed", { length: finalText.length });
          } catch (error) {
            const message = error instanceof Error ? error.message : "unknown_error";
            await write("error", { message });
            await write("done", { status: "error" });
            logError("agent_chat_failed", { error: message });
          } finally {
            close();
          }
        })().catch((error) => {
          logError("agent_chat_stream_error", { error });
          void write("error", { message: "stream_error" });
          void write("done", { status: "error" });
          close();
        });
      });

      logInfo("agent_chat_started", {
        messages: parsed.data.messages.length,
        orgId: userContext.org.id,
        lang: userContext.lang,
      });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : "internal_error";
      logError("agent_chat_exception", { error: message });
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  });
}

export const __setAgentSupabaseFactoryForTests = (
  factory: (() => Promise<SupabaseClient>) | null
) => {
  const globalRef = globalThis as unknown as {
    [SUPABASE_FACTORY_TOKEN]?: (() => Promise<SupabaseClient>) | null;
  };
  if (factory) {
    globalRef[SUPABASE_FACTORY_TOKEN] = factory;
  } else {
    delete globalRef[SUPABASE_FACTORY_TOKEN];
  }
};

export const __setAgentOpenAIFetchForTests = (implementation: typeof fetch | null) => {
  const globalRef = globalThis as unknown as { [OPENAI_FETCH_TOKEN]?: typeof fetch | null };
  if (implementation) {
    globalRef[OPENAI_FETCH_TOKEN] = implementation;
  } else {
    delete globalRef[OPENAI_FETCH_TOKEN];
  }
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
