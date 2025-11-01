import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { invokeTool, sendAssistMessage, type AssistMessage } from "../services/assist";

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
    mutationFn: (content: string) => sendAssistMessage(threadId, content),
    onSuccess: (message) => {
      setMessages((prev) => [...prev, message]);
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
