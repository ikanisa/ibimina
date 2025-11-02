import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import type {
  AgentClientOptions,
  AgentConversationOptions,
  AgentMessage,
  AgentPromptContext,
  AgentSessionMetadata,
  AgentStreamEvent,
  SupabaseLikeClient,
  ToolExecutionContext,
} from "./types";
import { AgentToolbox } from "./toolbox";

type ToolCall = {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type StreamParseResult =
  | {
      status: "completed";
      responseId: string | null;
      finalText: string;
    }
  | {
      status: "requires_action";
      responseId: string | null;
      finalText: string;
      toolCalls: ToolCall[];
    };

interface ExecutionContext {
  userId: string;
  orgId: string | null;
  lang: string;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => Promise<void> | void;
}

interface UserContext {
  lang: string;
  org: {
    id: string | null;
    name: string | null;
    country: string | null;
  };
}

const DEFAULT_RESPONSES_URL = "https://api.openai.com/v1/responses";

const DEFAULT_SYSTEM_PROMPT = (
  context: AgentPromptContext
) => `You are the Ibimina SACCO+ member support assistant. Respond primarily in ${context.language} and use short, factual answers. The member belongs to ${context.orgName ?? "their SACCO"} in ${context.country ?? "the region"}. Use internal tools when available, never fabricate data, and remind members not to share passwords or PINs.`;

export class AgentClient {
  private readonly supabase: SupabaseLikeClient;
  private readonly fetchImpl: typeof fetch;
  private readonly openai: OpenAI;
  private readonly toolbox: AgentToolbox;
  private readonly model: string;
  private readonly responsesUrl: string;
  private readonly systemPrompt?: string | ((context: AgentPromptContext) => string);
  private readonly apiKey: string;

  constructor(options: AgentClientOptions) {
    this.supabase = options.supabase;
    this.fetchImpl = options.fetch ?? fetch;
    this.model = options.model ?? "gpt-4.1-mini";
    this.responsesUrl = options.responsesUrl ?? DEFAULT_RESPONSES_URL;
    this.systemPrompt = options.systemPrompt;
    this.apiKey = options.apiKey;
    this.openai = new OpenAI({ apiKey: options.apiKey });
    this.toolbox = new AgentToolbox(this.supabase, this.openai);
  }

  async streamConversation(
    options: AgentConversationOptions
  ): Promise<{ text: string; metadata: AgentSessionMetadata }> {
    try {
      const userContext = await this.fetchUserContext(
        options.user.id,
        options.user.orgId ?? null,
        options.locale
      );

      const metadata: AgentSessionMetadata = {
        orgId: userContext.org.id,
        orgName: userContext.org.name,
        country: userContext.org.country,
        lang: userContext.lang,
        hashedIp: options.hashedIp ?? null,
      };

      await options.onEvent({ type: "metadata", data: metadata });

      const payload = {
        model: this.model,
        input: this.buildInputMessages(options.messages, metadata),
        stream: true,
        tools: this.toolbox.getDefinitions(),
        tool_choice: "auto" as const,
        metadata: {
          user_id: options.user.id,
          org_id: metadata.orgId,
          country: metadata.country,
          lang: metadata.lang,
        },
      } satisfies Record<string, unknown>;

      const finalText = await this.executeResponseLoop(payload, {
        userId: options.user.id,
        orgId: metadata.orgId,
        lang: metadata.lang,
        signal: options.signal,
        onEvent: options.onEvent,
      });

      await options.onEvent({ type: "message", data: { text: finalText } });
      await options.onEvent({ type: "done", data: { status: "completed" } });

      return { text: finalText, metadata };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      await options.onEvent({ type: "error", data: { message } });
      await options.onEvent({ type: "done", data: { status: "error" } });
      throw error;
    }
  }

  private buildInputMessages(
    messages: AgentMessage[],
    metadata: AgentSessionMetadata
  ) {
    const promptSource = this.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    const prompt =
      typeof promptSource === "function"
        ? promptSource({
            language: metadata.lang,
            orgName: metadata.orgName,
            country: metadata.country,
          })
        : promptSource;

    const systemMessage = {
      role: "system",
      content: [{ type: "input_text", text: prompt }],
    };

    const history = messages.map((message) => ({
      role: message.role,
      content: [{ type: "input_text", text: message.content }],
    }));

    return [systemMessage, ...history];
  }

  private async executeResponseLoop(
    body: Record<string, unknown>,
    context: ExecutionContext
  ): Promise<string> {
    let endpoint = this.responsesUrl;
    let requestBody: Record<string, unknown> | null = body;
    let finalText = "";
    let responseId: string | null = null;

    while (requestBody) {
      const response = await this.callOpenAI(endpoint, requestBody, context.signal);
      const result = await this.parseStream(response, context);
      if (result.finalText) {
        finalText = result.finalText;
      }
      if (result.responseId) {
        responseId = result.responseId;
      }
      if (result.status === "requires_action") {
        const toolOutputs = await this.handleToolCalls(
          result.toolCalls,
          context
        );
        if (!responseId) {
          throw new Error("Missing response id for tool submission");
        }
        endpoint = `${this.responsesUrl}/${responseId}/tool_outputs`;
        requestBody = { tool_outputs: toolOutputs, stream: true };
      } else {
        requestBody = null;
      }
    }

    return finalText;
  }

  private async parseStream(
    response: Response,
    context: ExecutionContext
  ): Promise<StreamParseResult> {
    if (!response.body) {
      throw new Error("OpenAI streaming response missing body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let responseId: string | null = null;
    let finalText = "";

    try {
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
            throw new Error("openai_parse_error");
          }

          const type = payload.type as string | undefined;

          if (type === "response.created" || type === "response.in_progress") {
            const id = (payload.response as { id?: string } | undefined)?.id;
            if (id) {
              responseId = id;
            }
            continue;
          }

          if (type === "response.output_text.delta") {
            const delta = (payload.delta as { text?: string } | undefined)?.text ?? "";
            if (delta) {
              finalText += delta;
              await context.onEvent({ type: "token", data: { text: delta } });
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
            if (outputText && !finalText) {
              finalText = outputText;
            }
            continue;
          }

          if (type === "response.required_action") {
            const toolCalls = (
              payload.required_action as {
                submit_tool_outputs?: { tool_calls?: ToolCall[] };
              }
            )?.submit_tool_outputs?.tool_calls;
            if (toolCalls && toolCalls.length > 0) {
              await reader.cancel();
              return {
                status: "requires_action",
                responseId,
                finalText,
                toolCalls,
              };
            }
            continue;
          }

          if (type === "response.error") {
            const error = payload.error as { message?: string } | undefined;
            throw new Error(error?.message ?? "OpenAI response error");
          }

          if (type === "response.completed") {
            return { status: "completed", responseId, finalText };
          }
        }
      }

      buffer += decoder.decode();
      if (buffer.trim().length > 0) {
        try {
          const payload = JSON.parse(buffer.trim()) as Record<string, unknown>;
          if (payload.type === "response.completed") {
            return { status: "completed", responseId, finalText };
          }
        } catch {
          // Ignore trailing parse errors
        }
      }
    } finally {
      await reader.cancel().catch(() => undefined);
    }

    return { status: "completed", responseId, finalText };
  }

  private async handleToolCalls(
    toolCalls: ToolCall[],
    context: ExecutionContext
  ): Promise<Array<{ tool_call_id: string; output: string }>> {
    const outputs: Array<{ tool_call_id: string; output: string }> = [];

    for (const call of toolCalls) {
      const toolId = call.id ?? randomUUID();
      const toolName = call.function?.name ?? "unknown";

      let args: Record<string, unknown> = {};
      if (call.function?.arguments) {
        try {
          args = JSON.parse(call.function.arguments) as Record<string, unknown>;
        } catch {
          await context.onEvent({
            type: "tool_result",
            data: { id: toolId, name: toolName, error: "Failed to parse tool arguments" },
          });
          outputs.push({
            tool_call_id: toolId,
            output: JSON.stringify({ error: "Failed to parse tool arguments" }),
          });
          continue;
        }
      }

      const toolContext: ToolExecutionContext = {
        userId: context.userId,
        orgId: context.orgId,
        lang: context.lang,
      };

      try {
        const result = await this.toolbox.execute(toolName, args, toolContext);
        await context.onEvent({
          type: "tool_result",
          data: { id: toolId, name: toolName, result },
        });
        outputs.push({ tool_call_id: toolId, output: JSON.stringify(result) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Tool execution failed";
        await context.onEvent({
          type: "tool_result",
          data: { id: toolId, name: toolName, error: message },
        });
        outputs.push({ tool_call_id: toolId, output: JSON.stringify({ error: message }) });
      }
    }

    return outputs;
  }

  private async callOpenAI(
    url: string,
    body: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<Response> {
    const response = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI error ${response.status}: ${errorText.slice(0, 200)}`);
    }

    return response;
  }

  private async fetchUserContext(
    userId: string,
    requestedOrgId: string | null,
    preferredLocale?: string
  ): Promise<UserContext> {
    let lang = preferredLocale ?? "en";

    try {
      const profileBuilder = this.supabase
        .from("members_app_profiles")
        .select("lang")
        .eq("user_id", userId);

      const profileResult =
        typeof (profileBuilder as { maybeSingle?: unknown }).maybeSingle ===
        "function"
          ? await (profileBuilder as {
              maybeSingle: () => Promise<{ data: { lang?: string } | null; error: unknown }>;
            }).maybeSingle()
          : await (profileBuilder as {
              single: () => Promise<{ data: { lang?: string } | null; error: unknown }>;
            }).single();

      if (!profileResult.error && profileResult.data?.lang) {
        lang = profileResult.data.lang;
      }
    } catch {
      // Ignore profile errors and fall back to default language
    }

    let orgId: string | null = null;
    let orgName: string | null = null;
    let country: string | null = null;

    try {
      const { data, error } = await this.supabase.rpc("agent_resolve_org_scope", {
        p_user: userId,
        p_org: requestedOrgId ?? null,
      });

      if (!error && data) {
        const scope = Array.isArray(data) ? data[0] : data;
        if (scope) {
          orgId = (scope as Record<string, unknown>).org_id as string | null;
          orgName = (scope as Record<string, unknown>).org_name as string | null;
          country = (scope as Record<string, unknown>).country_code as string | null;
        }
      }
    } catch {
      // Ignore scope errors; fall back to null org
    }

    return {
      lang: lang || "en",
      org: { id: orgId, name: orgName, country },
    };
  }
}
