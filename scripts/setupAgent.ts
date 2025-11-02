import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import OpenAI from "openai";
import type { AssistantTool } from "openai/resources/beta/assistants";
import { agentToolDefinitions } from "@ibimina/agent";
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

export const TOOL_SCHEMAS: AssistantTool[] = agentToolDefinitions.map((tool) => tool as AssistantTool);

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
