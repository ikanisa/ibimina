import type { Database } from "@/lib/supabase/types";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>
>;

interface ToolContext {
  supabase: SupabaseClient;
  userId: string;
  orgId: string | null;
  lang: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface ToolConfig {
  definition: ToolDefinition;
  handler: (args: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

const TOOLKIT: Record<string, ToolConfig> = {
  fetch_member_profile: {
    definition: {
      name: "fetch_member_profile",
      description:
        "Lookup the authenticated member's profile information, including preferred language and contact numbers.",
      parameters: {
        type: "object",
        properties: {
          include_contacts: { type: "boolean", description: "Include WhatsApp and MoMo numbers" },
        },
      },
    },
    handler: async (args, context) => {
      const includeContacts = Boolean(args.include_contacts);
      const { supabase, userId } = context;

      const supabaseAny = supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (
              column: string,
              value: string
            ) => {
              maybeSingle: () => Promise<{
                data: Database["public"]["Tables"]["members_app_profiles"]["Row"] | null;
                error: unknown;
              }>;
            };
          };
        };
      };

      const { data, error } = await supabaseAny
        .from("members_app_profiles")
        .select(
          includeContacts
            ? "user_id, lang, whatsapp_msisdn, momo_msisdn, is_verified"
            : "user_id, lang, is_verified"
        )
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error instanceof Error ? error : new Error("profile_lookup_failed");
      }

      if (!data) {
        return {
          exists: false,
        };
      }

      return {
        exists: true,
        lang: data.lang ?? "en",
        is_verified: Boolean(data.is_verified),
        whatsapp_msisdn: includeContacts ? (data.whatsapp_msisdn ?? null) : undefined,
        momo_msisdn: includeContacts ? (data.momo_msisdn ?? null) : undefined,
      };
    },
  },
  list_org_groups: {
    definition: {
      name: "list_org_groups",
      description:
        "Return recent ikimina (group) records for the member's organisation including group names and statuses.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
      },
    },
    handler: async (args, context) => {
      const { supabase, orgId } = context;
      if (!orgId) {
        return { groups: [] };
      }

      const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 20);

      const supabaseAny = supabase as unknown as {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (
              column: string,
              value: string
            ) => {
              order: (
                column: string,
                options: { ascending: boolean }
              ) => {
                limit: (count: number) => Promise<{
                  data: Array<{ id: string; name: string | null; status: string | null }> | null;
                  error: unknown;
                }>;
              };
            };
          };
        };
      };

      const { data, error } = await supabaseAny
        .from("ibimina")
        .select("id, name, status")
        .eq("sacco_id", orgId)
        .order("updated_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw error instanceof Error ? error : new Error("group_lookup_failed");
      }

      return {
        groups: (data ?? []).map((group) => ({
          id: group.id,
          name: group.name ?? "Unknown group",
          status: group.status ?? "UNKNOWN",
        })),
      };
    },
  },
};

export const getToolDefinitions = () =>
  Object.values(TOOLKIT).map(({ definition }) => ({
    type: "function",
    function: definition,
  }));

export const executeTool = async (
  name: string,
  args: Record<string, unknown>,
  context: ToolContext
) => {
  const tool = TOOLKIT[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return tool.handler(args, context);
};

export const __setToolHandlerForTests = (name: string, handler: ToolConfig["handler"] | null) => {
  if (handler) {
    TOOLKIT[name] = {
      definition: TOOLKIT[name]?.definition ?? {
        name,
        description: "Test tool",
        input_schema: { type: "object" },
      },
      handler,
    };
  } else {
    delete TOOLKIT[name];
  }
};
