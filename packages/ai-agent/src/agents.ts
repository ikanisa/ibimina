import type { AgentContext, AgentHandler, AgentName, ToolInvocation } from "./types.js";

function createToolInvocation(
  name: string,
  args: Record<string, unknown>,
  result: string
): ToolInvocation {
  return { name, args, result };
}

const keywordToAgent: Array<{ keywords: RegExp; agent: AgentName }> = [
  { keywords: /(bill|payment|invoice|charge|transaction)/i, agent: "billing-specialist" },
  {
    keywords: /(login|auth|error|bug|issue|crash|fail|down|status|offline)/i,
    agent: "technical-support",
  },
  { keywords: /(group|member|committee|team)/i, agent: "group-management" },
];

export const triageAgent: AgentHandler = async (input) => {
  const match = keywordToAgent.find((entry) => entry.keywords.test(input));

  if (!match) {
    return {
      reply:
        "I'm your Ibimina support assistant. I can help with billing, technical issues, or group management. Could you share a bit more detail?",
    };
  }

  return {
    reply: `I'll connect you with our ${match.agent.replace("-", " ")} agent who specialises in that topic.`,
    handoff: match.agent,
  };
};

export const billingAgent: AgentHandler = async (input, context) => {
  const toolInvocations: ToolInvocation[] = [];

  const membershipMatch = input.match(/MEM[-\s]?\d{3,}/i);
  if (membershipMatch) {
    const id = membershipMatch[0].replace(/\s+/g, "-").toUpperCase();
    const result = await context.tools.lookupMember(id);
    toolInvocations.push(createToolInvocation("lookupMember", { membershipId: id }, result));
  }

  const transactionMatch = input.match(/TX[-\s]?\d{3,}/i);
  if (transactionMatch) {
    const id = transactionMatch[0].replace(/\s+/g, "-").toUpperCase();
    const result = await context.tools.lookupTransaction(id);
    toolInvocations.push(createToolInvocation("lookupTransaction", { transactionId: id }, result));
  }

  const baseReply =
    "Here is what I found regarding your billing question. Let me know if there are any other details you would like me to check.";

  return {
    reply: baseReply,
    toolInvocations: toolInvocations.length ? toolInvocations : undefined,
  };
};

export const technicalSupportAgent: AgentHandler = async (input, context) => {
  const toolInvocations: ToolInvocation[] = [];

  if (/status|down|offline|latency|health/i.test(input)) {
    const result = await context.tools.systemHealth();
    toolInvocations.push(createToolInvocation("systemHealth", {}, result));
  }

  if (/documentation|how\s+do\s+i|where\s+can\s+i/i.test(input)) {
    const topicMatch = input.match(/for\s+([a-zA-Z\s]+)/i);
    const topic = topicMatch ? topicMatch[1].trim() : "general";
    const result = await context.tools.getPlatformDoc(topic);
    toolInvocations.push(createToolInvocation("getPlatformDoc", { topic }, result));
  }

  const guidance =
    "I've reviewed your technical issue. Please follow the steps above and tell me if the problem persists or if you see any new errors.";

  return { reply: guidance, toolInvocations: toolInvocations.length ? toolInvocations : undefined };
};

export const groupManagementAgent: AgentHandler = async (input, context) => {
  const toolInvocations: ToolInvocation[] = [];

  if (/member|invite|onboard/i.test(input)) {
    const result = await context.tools.getPlatformDoc("groups");
    toolInvocations.push(createToolInvocation("getPlatformDoc", { topic: "groups" }, result));
  }

  const instructions =
    "Group tasks can be handled from the admin console. I've shared the relevant steps above—feel free to ask if you need clarification.";

  return {
    reply: instructions,
    toolInvocations: toolInvocations.length ? toolInvocations : undefined,
  };
};

export function resolveAgent(name: AgentName): AgentHandler {
  switch (name) {
    case "billing-specialist":
      return billingAgent;
    case "technical-support":
      return technicalSupportAgent;
    case "group-management":
      return groupManagementAgent;
    default:
      return triageAgent;
  }
}
