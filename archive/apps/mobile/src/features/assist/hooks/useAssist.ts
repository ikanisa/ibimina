import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { invokeTool, streamAssistMessage, type AssistMessage, type AssistStreamEvent } from "../services/assist";

export const useAssist = () => {
  const [threadId] = useState(() => `thread-${Date.now()}`);
  const [messages, setMessages] = useState<AssistMessage[]>([]);

  const allocationsQuery = useQuery({
    queryKey: ["assist", "allocations"],
    queryFn: () => invokeTool<{ allocations: unknown[] }>("allocations.read_mine", {}),
  });

  const kbQuery = useQuery({
    queryKey: ["assist", "kb"],
    queryFn: () =>
      invokeTool<{ hits: Array<{ title: string; url: string }> }>("kb.search", {
        query: "payments",
      }),
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const userMessage: AssistMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);

      let assistantId: string | null = null;
      let buffer = "";

      const handleEvent = (event: AssistStreamEvent) => {
        if (event.type === "message-start") {
          assistantId = event.messageId;
          buffer = "";
          setMessages((prev) => [
            ...prev,
            { id: event.messageId, role: "assistant", content: "" },
          ]);
          return;
        }

        if (!assistantId) {
          return;
        }

        if (event.type === "message-delta") {
          buffer += event.delta;
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: buffer } : message
            )
          );
          return;
        }

        if (event.type === "message-end") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantId ? { ...message, content: buffer } : message
            )
          );
          return;
        }

        if (event.type === "tool") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === event.messageId
                ? { ...message, toolInvocations: event.invocations }
                : message
            )
          );
        }
      };

      await streamAssistMessage({
        threadId,
        content,
        onEvent: handleEvent,
      });
    },
  });

  const meta = useMemo(
    () => ({
      allocations: allocationsQuery.data?.data.allocations ?? [],
      kbHits: kbQuery.data?.data.hits ?? [],
    }),
    [allocationsQuery.data, kbQuery.data]
  );

  return {
    threadId,
    messages,
    meta,
    sendMutation,
    isLoading: allocationsQuery.isLoading || kbQuery.isLoading,
  };
};
