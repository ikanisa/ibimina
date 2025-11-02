import OpenAI from "openai";
import {
  AllocationPayload,
  AllocationRow,
  AgentToolDefinition,
  LocalizedCopy,
  TicketPayload,
  ToolExecutionContext,
  ToolExecutionResult,
  SupabaseLikeClient,
} from "./types";

const EMBEDDING_MODEL = "text-embedding-3-large";

const TOOL_DEFINITIONS: AgentToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "kb.search",
      description:
        "Search Ibimina knowledge bases and FAQs for policies, walkthroughs, or answers that match a user's question.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Natural-language search string describing what the member or staff needs help with.",
          },
          org_id: {
            type: "string",
            description: "UUID of the SACCO/organisation to scope the search (optional).",
          },
          language: {
            type: "string",
            description: "Language code to favour in results (en, rw, fr).",
            enum: ["en", "rw", "fr"],
          },
          limit: {
            type: "integer",
            description: "Maximum number of knowledge base matches to return.",
            minimum: 1,
            maximum: 20,
            default: 5,
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "allocations.read_mine",
      description:
        "Retrieve the latest wallet allocations or statements tied to a member's reference token within a SACCO.",
      parameters: {
        type: "object",
        properties: {
          reference_token: {
            type: "string",
            description: "Reference token belonging to the member or group.",
          },
          org_id: {
            type: "string",
            description: "UUID of the SACCO to scope the allocation query (optional).",
          },
          include_pending: {
            type: "boolean",
            description: "Include pending or unallocated transactions when true.",
            default: false,
          },
          limit: {
            type: "integer",
            description: "Maximum allocation rows to return sorted by newest first.",
            minimum: 1,
            maximum: 100,
            default: 25,
          },
        },
        required: ["reference_token"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reference.generate",
      description:
        "Generate or recover a secure reference token for a member, group, or payment workflow so they can resume onboarding or payments.",
      parameters: {
        type: "object",
        properties: {
          org_id: {
            type: "string",
            description: "UUID of the SACCO issuing the reference token.",
          },
          member_id: {
            type: "string",
            description: "UUID of the member profile when known (optional).",
          },
          channel: {
            type: "string",
            description: "Channel requesting the token (app, ussd, whatsapp).",
            enum: ["app", "ussd", "whatsapp"],
          },
          purpose: {
            type: "string",
            description:
              "Short explanation of why the token is needed (e.g. 'loan_application', 'wallet_topup').",
          },
          expires_in_minutes: {
            type: "integer",
            description: "Custom expiry in minutes for the token if overriding defaults.",
            minimum: 5,
            maximum: 1440,
          },
          notes: {
            type: "string",
            description: "Additional context to store alongside the generated token.",
          },
        },
        required: ["org_id", "purpose"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tickets.create",
      description:
        "Create a support ticket capturing unresolved issues, escalations, or follow-up actions for the SACCO support team.",
      parameters: {
        type: "object",
        properties: {
          org_id: {
            type: "string",
            description: "UUID of the SACCO owning the ticket.",
          },
          subject: {
            type: "string",
            description: "Short subject line describing the issue.",
          },
          summary: {
            type: "string",
            description:
              "Detailed summary of the problem, steps taken, and requested next actions.",
          },
          channel: {
            type: "string",
            description: "Channel where the request originated.",
            enum: ["in_app", "whatsapp", "email", "ivr"],
          },
          priority: {
            type: "string",
            description: "Ticket urgency level.",
            enum: ["low", "normal", "high", "urgent"],
            default: "normal",
          },
          reference_token: {
            type: "string",
            description: "Reference token tied to the affected member or group when applicable.",
          },
          attachments: {
            type: "array",
            description: "Optional list of artefacts that should be linked to the ticket.",
            items: { type: "string" },
          },
        },
        required: ["org_id", "subject", "summary"],
        additionalProperties: false,
      },
    },
  },
];

const STATUS_COPY: Record<string, LocalizedCopy> = {
  open: {
    en: "Open",
    rw: "Irakinguye",
    fr: "Ouvert",
  },
  pending: {
    en: "Pending",
    rw: "Itegereje",
    fr: "En attente",
  },
  resolved: {
    en: "Resolved",
    rw: "Byakemutse",
    fr: "Résolu",
  },
  closed: {
    en: "Closed",
    rw: "Byarangiye",
    fr: "Clôturé",
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeCopy(value: string): LocalizedCopy {
  return {
    en: value,
    rw: value,
    fr: value,
  };
}

export class AgentToolbox {
  constructor(
    private readonly supabase: SupabaseLikeClient,
    private readonly openai: OpenAI
  ) {}

  getDefinitions(): AgentToolDefinition[] {
    return TOOL_DEFINITIONS;
  }

  async execute(
    name: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    switch (name) {
      case "kb.search":
        return this.executeKnowledgeSearch(args, context);
      case "allocations.read_mine":
        return this.executeAllocations(args, context);
      case "reference.generate":
        return this.executeReference(args, context);
      case "tickets.create":
        return this.executeTicket(args, context);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async executeKnowledgeSearch(
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const query = String(args.query ?? "").trim();
    if (!query) {
      throw new Error("query is required");
    }

    const limit = clamp(Number(args.limit ?? 5), 1, 20);
    const orgId = typeof args.org_id === "string" ? args.org_id : context.orgId;
    const language = typeof args.language === "string" ? args.language : context.lang;

    const embeddingResponse = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });

    const embedding = embeddingResponse.data[0]?.embedding as number[] | undefined;
    if (!embedding) {
      throw new Error("embedding_failed");
    }

    const { data, error } = await this.supabase.rpc("agent_kb_search", {
      p_user: context.userId,
      query_embedding: embedding,
      query_text: query,
      target_org: orgId ?? null,
      language_filter: language ?? null,
      match_limit: limit,
    });

    if (error) {
      throw new Error(error.message ?? "kb_search_failed");
    }

    return {
      kind: "kb.search",
      payload: {
        query,
        language,
        org_id: orgId ?? null,
        matches: Array.isArray(data) ? data : [],
      },
      raw: data,
    };
  }

  private async executeAllocations(
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const referenceToken = String(args.reference_token ?? "").trim();
    if (!referenceToken) {
      throw new Error("reference_token is required");
    }

    const includePending = Boolean(args.include_pending);
    const limit = clamp(Number(args.limit ?? 25), 1, 100);
    const orgId = typeof args.org_id === "string" ? args.org_id : context.orgId;

    const { data, error } = await this.supabase.rpc(
      "agent_allocations_read_mine",
      {
        p_user: context.userId,
        p_reference_token: referenceToken,
        p_org: orgId ?? null,
        p_include_pending: includePending,
        p_limit: limit,
      }
    );

    if (error) {
      throw new Error(error.message ?? "allocations_lookup_failed");
    }

    const rows = Array.isArray(data) ? data : [];
    const allocations: AllocationRow[] = rows.map((row, index) => ({
      id: String(
        (row as Record<string, unknown>).allocation_id ??
          (row as Record<string, unknown>).id ??
          `${referenceToken}-${index}`
      ),
      groupName: String(
        (row as Record<string, unknown>).group_name ??
          (row as Record<string, unknown>).sacco_name ??
          "Unknown group"
      ),
      amount: Number((row as Record<string, unknown>).amount ?? 0),
      reference: String(
        (row as Record<string, unknown>).reference ?? referenceToken
      ),
      status: String((row as Record<string, unknown>).status ?? "UNKNOWN"),
      allocatedAt: new Date(
        (row as Record<string, unknown>).allocated_at ??
          (row as Record<string, unknown>).ts ??
          Date.now()
      ).toISOString(),
    }));

    const heading: LocalizedCopy = {
      en: "Recent allocations",
      rw: "Ibyagenwe biheruka",
      fr: "Allocations récentes",
    };

    const summary = allocations.length
      ? {
          en: `We found ${allocations.length} allocation records matching ${referenceToken}.`,
          rw: `${allocations.length} byabonetse bihuye na ${referenceToken}.`,
          fr: `${allocations.length} allocations correspondent à ${referenceToken}.`,
        }
      : {
          en: `No allocations were found for ${referenceToken}.`,
          rw: `Nta byagenwe byabonetse kuri ${referenceToken}.`,
          fr: `Aucune allocation trouvée pour ${referenceToken}.`,
        };

    const payload: AllocationPayload = {
      heading,
      subheading: summary,
      allocations,
    };

    return {
      kind: "allocation",
      payload,
      raw: rows,
    };
  }

  private async executeReference(
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const orgId = typeof args.org_id === "string" ? args.org_id : context.orgId;
    if (!orgId) {
      throw new Error("org_id is required to generate a reference token");
    }

    const purpose = String(args.purpose ?? "").trim();
    if (!purpose) {
      throw new Error("purpose is required to generate a reference token");
    }

    const { data, error } = await this.supabase.rpc(
      "agent_reference_generate",
      {
        p_user: context.userId,
        p_org: orgId,
        p_channel: (args.channel as string) ?? "app",
        p_purpose: purpose,
        p_member_id: (args.member_id as string) ?? null,
        p_expires_in_minutes:
          typeof args.expires_in_minutes === "number"
            ? args.expires_in_minutes
            : null,
        p_notes: (args.notes as string) ?? null,
      }
    );

    if (error) {
      throw new Error(error.message ?? "reference_token_failed");
    }

    const tokenRecord = Array.isArray(data) ? data[0] : data;

    return {
      kind: "reference",
      payload: {
        token: (tokenRecord as Record<string, unknown>)?.token ?? null,
        expires_at: (tokenRecord as Record<string, unknown>)?.expires_at ?? null,
        channel: (args.channel as string) ?? "app",
        purpose,
      },
      raw: tokenRecord,
    };
  }

  private async executeTicket(
    args: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<ToolExecutionResult> {
    const orgId = typeof args.org_id === "string" ? args.org_id : context.orgId;
    if (!orgId) {
      throw new Error("org_id is required to create a ticket");
    }

    const subject = String(args.subject ?? "").trim();
    const summary = String(args.summary ?? "").trim();

    if (!subject || !summary) {
      throw new Error("subject and summary are required to create a ticket");
    }

    const { data, error } = await this.supabase.rpc("agent_tickets_create", {
      p_user: context.userId,
      p_org: orgId,
      p_subject: subject,
      p_summary: summary,
      p_channel: (args.channel as string) ?? "in_app",
      p_priority: (args.priority as string) ?? "normal",
      p_reference_token: (args.reference_token as string) ?? null,
    });

    if (error) {
      throw new Error(error.message ?? "ticket_create_failed");
    }

    const ticketRecord = Array.isArray(data) ? data[0] : data;
    const statusKey = String(
      (ticketRecord as Record<string, unknown>)?.status ?? "open"
    ).toLowerCase();
    const statusCopy = STATUS_COPY[statusKey] ?? STATUS_COPY.open;

    const payload: TicketPayload = {
      heading: {
        en: "Support ticket created",
        rw: "Itike y'ubufasha yoherejwe",
        fr: "Ticket d'assistance créé",
      },
      reference: String(
        (ticketRecord as Record<string, unknown>)?.reference ??
          (ticketRecord as Record<string, unknown>)?.ticket_id ??
          ""
      ),
      status: statusCopy,
      submittedAt: new Date(
        (ticketRecord as Record<string, unknown>)?.submitted_at ??
          Date.now()
      ).toISOString(),
      summary: normalizeCopy(summary),
    };

    return {
      kind: "ticket",
      payload,
      raw: ticketRecord,
    };
  }
}

export const agentToolDefinitions = TOOL_DEFINITIONS;
