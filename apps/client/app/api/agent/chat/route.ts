import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { z } from "zod";
import { AgentClient } from "@ibimina/agent";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logError, logInfo, updateLogContext, withLogContext } from "@/lib/observability/logger";
import { enforceRateLimit, hashRateLimitKey } from "@/lib/rate-limit";

type SupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type RequestContext = {
  lang: string;
  org: {
    id: string | null;
    name: string | null;
    country: string | null;
  };
};

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

const fetchRequestContext = async (
  supabase: SupabaseClient,
  userId: string,
  requestedOrgId: string | undefined
): Promise<RequestContext> => {
  let lang = "en";
  try {
    const profileQuery = supabase
      .from("members_app_profiles")
      .select("lang")
      .eq("user_id", userId);

    const profileResult =
      typeof (profileQuery as { maybeSingle?: () => Promise<{ data: { lang?: string } | null }> }).maybeSingle ===
      "function"
        ? await (profileQuery as {
            maybeSingle: () => Promise<{ data: { lang?: string } | null } | null>;
          }).maybeSingle()
        : await (profileQuery as {
            single: () => Promise<{ data: { lang?: string } | null }>;
          }).single();

    if (profileResult?.data?.lang) {
      lang = profileResult.data.lang;
    }
  } catch {
    // Ignore failures and continue with default language
  }

  let org: RequestContext["org"] = { id: null, name: null, country: null };
  try {
    const { data, error } = await supabase.rpc("agent_resolve_org_scope", {
      p_user: userId,
      p_org: requestedOrgId ?? null,
    });

    if (!error && data) {
      const scope = Array.isArray(data) ? data[0] : data;
      if (scope) {
        org = {
          id: (scope as Record<string, unknown>).org_id as string | null,
          name: (scope as Record<string, unknown>).org_name as string | null,
          country: (scope as Record<string, unknown>).country_code as string | null,
        };
      }
    }
  } catch {
    // Ignore scope errors and continue with null org context
  }

  return { lang: lang || "en", org };
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

      const context = await fetchRequestContext(supabase, user.id, parsed.data.orgId);
      if (context.org.id) {
        updateLogContext({ orgId: context.org.id });
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
        if (context.org.id) {
          await enforceRateLimit(hashRateLimitKey("agent", "org", context.org.id), {
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
          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) {
            await write("error", { message: "OPENAI_API_KEY is not configured" });
            await write("done", { status: "error" });
            close();
            logError("agent_chat_failed", { error: "missing_openai_key" });
            return;
          }

          let errorEmitted = false;
          let finalText = "";

          try {
            const client = new AgentClient({
              supabase,
              apiKey,
              model: OPENAI_MODEL,
              responsesUrl: OPENAI_BASE_URL,
              fetch: getFetchImpl(),
            });

            const hashedIp = ip ? hashRateLimitKey("agent", "ip", ip).slice(0, 12) : null;

            const result = await client.streamConversation({
              messages: parsed.data.messages,
              user: { id: user.id, orgId: parsed.data.orgId ?? null },
              hashedIp,
              locale: context.lang,
              signal: request.signal,
              onEvent: async (event) => {
                switch (event.type) {
                  case "metadata":
                    await write("metadata", {
                      org: {
                        id: event.data.orgId,
                        name: event.data.orgName,
                        country: event.data.country,
                      },
                      lang: event.data.lang,
                      ip: event.data.hashedIp,
                    });
                    break;
                  case "token":
                    await write("token", event.data);
                    break;
                  case "tool_result":
                    await write("tool_result", event.data);
                    break;
                  case "message":
                    finalText = event.data.text ?? "";
                    await write("message", event.data);
                    break;
                  case "done":
                    await write("done", event.data);
                    break;
                  case "error":
                    errorEmitted = true;
                    await write("error", event.data);
                    break;
                  default:
                    break;
                }
              },
            });

            finalText = result.text;
            logInfo("agent_chat_completed", { length: finalText.length });
          } catch (error) {
            const message = error instanceof Error ? error.message : "unknown_error";
            if (!errorEmitted) {
              await write("error", { message });
              await write("done", { status: "error" });
            }
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
        orgId: context.org.id,
        lang: context.lang,
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
