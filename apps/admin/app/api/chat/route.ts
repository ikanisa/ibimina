import { NextRequest } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { runAgentTurn } from "@ibimina/ai-agent";
import { captureServerEvent } from "@ibimina/lib";

const schema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const start = performance.now();

  try {
    const body = await request.json();
    const parsed = schema.parse(body);

    const response = await runAgentTurn(parsed);

    const duration = performance.now() - start;

    await captureServerEvent(
      "chat_turn_complete",
      {
        sessionId: parsed.sessionId,
        durationMs: Number(duration.toFixed(2)),
        agent: response.session.currentAgent,
        toolsUsed: response.toolInvocations?.length ?? 0,
      },
      "chat-agent"
    );

    return Response.json(response);
  } catch (error) {
    Sentry.captureException(error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
