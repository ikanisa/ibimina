import { NextRequest } from "next/server";
import { bootstrapAgentSession, runAgentTurn } from "@ibimina/ai-agent";

const encoder = new TextEncoder();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function writeEvent(controller: ReadableStreamDefaultController, event: string, data: unknown) {
  controller.enqueue(encoder.encode(`event: ${event}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function POST(request: NextRequest) {
  const { message, sessionId } = await request.json();
  const session = bootstrapAgentSession(sessionId);

  const stream = new ReadableStream({
    async start(controller) {
      const resolvedMessageId = `assistant-${Date.now()}`;
      const abort = () => {
        try {
          controller.close();
        } catch (error) {
          console.warn("SSE controller already closed", error);
        }
      };
      request.signal.addEventListener("abort", abort);

      writeEvent(controller, "session", { sessionId: session.id, historyLength: session.history.length });
      writeEvent(controller, "message", { type: "message-start", messageId: resolvedMessageId });

      const result = await runAgentTurn({ sessionId: session.id, message: String(message ?? "") });
      const parts = result.reply.split(/(\s+)/);

      for (const part of parts) {
        if (!part) continue;
        writeEvent(controller, "message", {
          type: "message-delta",
          messageId: resolvedMessageId,
          delta: part,
        });
        await sleep(40);
      }

      writeEvent(controller, "message", { type: "message-end", messageId: resolvedMessageId });

      if (result.toolInvocations?.length) {
        writeEvent(controller, "tool", { messageId: resolvedMessageId, invocations: result.toolInvocations });
      }

      writeEvent(controller, "session", { sessionId: session.id, historyLength: session.history.length });

      controller.close();
      request.signal.removeEventListener("abort", abort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export const runtime = "edge";
export const dynamic = "force-dynamic";
