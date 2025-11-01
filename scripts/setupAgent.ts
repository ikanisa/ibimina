import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import OpenAI from "openai";
import type { AssistantTool } from "openai/resources/beta/assistants";
import { config as loadEnv } from "dotenv";

const ENV_FILES = [".env.local", ".env", ".env.production", ".env.production.local"];
const AGENT_ID_ENV_KEY = "OPENAI_SUPPORT_AGENT_ID";
const MODEL_ENV_KEY = "OPENAI_SUPPORT_AGENT_MODEL";
const DEFAULT_MODEL = "gpt-4o-mini";
const AGENT_NAME = "Ibimina SACCO+ Support";
const AGENT_DESCRIPTION = "Autonomous SACCO+ support agent for members and staff.";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const promptDir = path.join(repoRoot, "docs", "agents", "support-agent");
const systemInstructionsPath = path.join(promptDir, "system-instructions.txt");
const languagePolicyPath = path.join(promptDir, "language-policy.txt");

for (const envFile of ENV_FILES) {
  const absolutePath = path.join(repoRoot, envFile);
  if (fs.existsSync(absolutePath)) {
    loadEnv({ path: absolutePath, override: false });
  }
}

function readPrompt(filePath: string, label: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label} file at ${path.relative(repoRoot, filePath)}`);
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    throw new Error(`${label} file at ${path.relative(repoRoot, filePath)} is empty`);
  }
  return raw;
}

const SYSTEM_INSTRUCTIONS = readPrompt(systemInstructionsPath, "system instructions");
const LANGUAGE_POLICY = readPrompt(languagePolicyPath, "language policy");

export const TOOL_SCHEMAS: AssistantTool[] = [
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
            items: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Signed URL pointing to the attachment.",
                  format: "uri",
                },
                name: { type: "string", description: "File name to display to staff." },
                mime_type: { type: "string", description: "MIME type of the attachment." },
              },
              required: ["url"],
              additionalProperties: false,
            },
          },
        },
        required: ["org_id", "subject", "summary", "channel"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tickets.add_message",
      description:
        "Append a structured message, note, or attachment to an existing support ticket conversation thread.",
      parameters: {
        type: "object",
        properties: {
          ticket_id: {
            type: "string",
            description: "UUID of the ticket that should receive the new message.",
          },
          sender: {
            type: "string",
            description: "Who is adding the message (user, agent, staff).",
            enum: ["user", "agent", "staff"],
          },
          content: {
            type: "string",
            description: "Message body, including any troubleshooting steps already taken.",
          },
          attachments: {
            type: "array",
            description: "Optional list of attachment metadata to include with the message.",
            items: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Signed URL pointing to the attachment.",
                  format: "uri",
                },
                name: { type: "string", description: "File name for the attachment." },
                mime_type: { type: "string", description: "MIME type of the attachment." },
              },
              required: ["url"],
              additionalProperties: false,
            },
          },
        },
        required: ["ticket_id", "sender", "content"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "directory.lookup",
      description:
        "Look up SACCO branch, staff, or service directory entries to share verified contact or escalation information.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search string such as staff name, branch, or service keyword.",
          },
          kind: {
            type: "string",
            description: "Type of directory entry requested.",
            enum: ["sacco", "branch", "staff", "service"],
          },
          country_code: {
            type: "string",
            description:
              "ISO country code to narrow results when multiple countries are supported.",
          },
          limit: {
            type: "integer",
            description: "Maximum number of directory matches to return.",
            minimum: 1,
            maximum: 20,
            default: 5,
          },
        },
        required: ["query", "kind"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web.search",
      description:
        "Perform a compliant web search when knowledge base data is insufficient, returning factual snippets with sources.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query including key entities and intent.",
          },
          focus: {
            type: "string",
            description: "Optional topical focus such as 'regulation', 'news', or 'partner'.",
          },
          time_filter: {
            type: "string",
            description: "Optional ISO-8601 timeframe constraint (e.g., 'P30D' for last 30 days).",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

export function buildInstructions(): string {
  return `${SYSTEM_INSTRUCTIONS}\n\nLanguage Policy:\n${LANGUAGE_POLICY}`;
}

export function buildAssistantPayload(modelOverride?: string) {
  return {
    name: AGENT_NAME,
    description: AGENT_DESCRIPTION,
    model: modelOverride?.trim() || process.env[MODEL_ENV_KEY]?.trim() || DEFAULT_MODEL,
    instructions: buildInstructions(),
    tools: TOOL_SCHEMAS,
    metadata: {
      managed_by: "ibimina-devops",
      language_policy_version: "2025-10-31",
    },
  };
}

function persistAgentId(agentId: string) {
  const envPath = path.join(repoRoot, ".env.local");
  const line = `${AGENT_ID_ENV_KEY}=${agentId}`;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, `${line}\n`, "utf8");
    return;
  }

  const existing = fs.readFileSync(envPath, "utf8");
  const lines = existing.split(/\r?\n/);
  let replaced = false;

  const nextLines = lines.map((entry) => {
    if (entry.startsWith(`${AGENT_ID_ENV_KEY}=`)) {
      replaced = true;
      return line;
    }
    return entry;
  });

  if (!replaced) {
    nextLines.push(line);
  }

  const sanitized = nextLines.filter(
    (entry, index, arr) => !(entry === "" && index === arr.length - 1)
  );
  fs.writeFileSync(envPath, `${sanitized.join("\n").trim()}\n`, "utf8");
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const isDryRun = process.env.DRY_RUN === "1";

  if (!apiKey && !isDryRun) {
    throw new Error(
      "Missing OPENAI_API_KEY. Export it or add it to your environment before running the setup script."
    );
  }

  const payload = buildAssistantPayload();
  const existingAgentId = process.env[AGENT_ID_ENV_KEY]?.trim();

  if (isDryRun) {
    console.info(
      "[setupAgent] DRY_RUN=1 — skipping API calls. Payload preview:\n",
      JSON.stringify(payload, null, 2)
    );
    return;
  }

  const client = new OpenAI({ apiKey: apiKey! });

  if (existingAgentId) {
    const updated = await client.beta.assistants.update(existingAgentId, payload);
    console.info(`[setupAgent] Updated assistant ${updated.id}`);
    persistAgentId(updated.id);
    return;
  }

  const created = await client.beta.assistants.create(payload);
  console.info(`[setupAgent] Created assistant ${created.id}`);
  persistAgentId(created.id);
}

const isDirectExecution = !!process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectExecution) {
  main().catch((error) => {
    console.error("[setupAgent] Failed to configure agent:", error);
    process.exitCode = 1;
  });
}
