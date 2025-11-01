import { NextRequest } from "next/server";
import { performance } from "node:perf_hooks";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { AIAgent, type ChatRequest } from "@ibimina/ai-agent/src/index";
import { captureServerEvent } from "@ibimina/lib";

const schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().min(1),
      })
    )
    .min(1),
});

const agent = new AIAgent(process.env.OPENAI_API_KEY ?? "");

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  let payload: ChatRequest;
  try {
    const parsed = schema.parse(await request.json());
    payload = parsed;
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const start = performance.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let firstChunkAt: number | null = null;
      let finalPlan: Awaited<ReturnType<typeof agent.chat>> | undefined;

      try {
        const iterator = agent.streamChat(payload);

        while (true) {
          const { value, done } = await iterator.next();
          if (done) {
            finalPlan = value ?? undefined;
            break;
          }

          if (!value) {
            continue;
          }

          if (value.type === "token" && value.data) {
            if (firstChunkAt === null) {
              firstChunkAt = performance.now();
            }
            controller.enqueue(encoder.encode(sse(value)));
          } else if (value.type === "metrics") {
            controller.enqueue(encoder.encode(sse(value)));
          }
        }

        const duration = performance.now() - start;
        const ttft = firstChunkAt ? firstChunkAt - start : duration;

        await captureServerEvent(
          "chat_stream_complete",
          {
            ttftMs: Number(ttft.toFixed(2)),
            durationMs: Number(duration.toFixed(2)),
            escalate: finalPlan?.escalate ?? false,
          },
          "chat-agent"
        );

        controller.close();
      } catch (error) {
        Sentry.captureException(error);
        controller.enqueue(
          encoder.encode(
            sse({
              type: "token",
              data: "I’m sorry, I ran into an issue while processing that request. Please try again in a moment.",
            })
          )
        );
        controller.close();
      }
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
