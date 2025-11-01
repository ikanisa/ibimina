export interface SSEMessage<T = unknown> {
  event: string;
  data: T;
}

export interface StreamSSEOptions<T = unknown> {
  response: Response;
  onMessage: (message: SSEMessage<T>) => void | Promise<void>;
  signal?: AbortSignal;
}

/**
 * Streams a Server-Sent Events (SSE) response and emits parsed messages.
 *
 * The implementation honours AbortController cancellation which is critical for
 * stopping the AI chat streaming flow when the user taps the "Stop" button.
 */
export async function streamSSE<T = unknown>({
  response,
  onMessage,
  signal,
}: StreamSSEOptions<T>): Promise<void> {
  if (!response.body) {
    throw new Error("Response body is not readable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  const abort = () => {
    try {
      reader.cancel();
    } catch (error) {
      // Cancellation may throw if the reader is already closed; swallow the error.
      if (process.env.NODE_ENV !== "production") {
        console.debug("SSE reader cancellation error", error);
      }
    }
  };

  if (signal) {
    if (signal.aborted) {
      abort();
      throw new DOMException("Aborted", "AbortError");
    }
    signal.addEventListener("abort", abort, { once: true });
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const separatorIndex = buffer.indexOf("\n\n");
        if (separatorIndex === -1) break;

        const rawEvent = buffer.slice(0, separatorIndex).trim();
        buffer = buffer.slice(separatorIndex + 2);

        if (!rawEvent) continue;

        const eventLines = rawEvent.split("\n");
        let eventName = "message";
        let dataPayload = "";

        for (const line of eventLines) {
          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            dataPayload += line.slice(5).trim();
          }
        }

        if (!dataPayload) continue;

        let parsed: unknown;
        try {
          parsed = JSON.parse(dataPayload);
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Failed to parse SSE payload", error, dataPayload);
          }
          continue;
        }

        await onMessage({ event: eventName, data: parsed as T });
      }
    }

    // Flush any trailing data (without delimiter) when the stream closes
    buffer += decoder.decode();
    if (buffer.trim().length > 0) {
      const eventLines = buffer.trim().split("\n");
      let eventName = "message";
      let dataPayload = "";
      for (const line of eventLines) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataPayload += line.slice(5).trim();
        }
      }
      if (dataPayload) {
        try {
          const parsed = JSON.parse(dataPayload);
          await onMessage({ event: eventName, data: parsed as T });
        } catch (error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Failed to parse trailing SSE payload", error, dataPayload);
          }
        }
      }
    }
  } catch (error) {
    if ((error as DOMException).name === "AbortError") {
      return;
    }
    throw error;
  } finally {
    if (signal) {
      signal.removeEventListener("abort", abort);
    }
    await reader.cancel().catch(() => undefined);
  }
}
