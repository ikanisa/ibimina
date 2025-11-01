import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/agent/chat/route";

const normalizeHeaders = (req: IncomingMessage) => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }
  return headers;
};

const handleRequest = async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url || req.method !== "POST" || !req.url.startsWith("/api/agent/chat")) {
    res.statusCode = 404;
    res.end();
    return;
  }

  const chunks: Uint8Array[] = [];
  req.on("data", (chunk: Uint8Array) => {
    chunks.push(chunk);
  });

  req.on("end", async () => {
    try {
      const bodyBuffer = Buffer.concat(chunks);
      const headers = normalizeHeaders(req);
      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers,
        body: bodyBuffer.length > 0 ? bodyBuffer : undefined,
      });

      const nextRequest = new NextRequest(request);
      const response = await POST(nextRequest);
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));

      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            res.write(Buffer.from(value));
          }
        }
      }

      res.end();
    } catch (error) {
      res.statusCode = 500;
      res.end(error instanceof Error ? error.message : String(error));
    }
  });
};

export const createAgentTestServer = () => createServer(handleRequest);
