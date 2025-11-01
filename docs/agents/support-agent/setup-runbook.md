# Ibimina Support Agent Setup

This runbook explains how to create or update the OpenAI assistant that powers
the Ibimina SACCO+ autonomous support workflow.

## Prerequisites

- OpenAI API key with access to the Assistants API
- Node.js 20+ and pnpm (workspace standard)
- Network access to `api.openai.com`
- The repository cloned locally with access to `.env.local`

## Environment variables

Add the following keys to your local or staging secrets store (`.env.local`,
Vercel, Supabase secrets, etc.). Example values are shown in `.env.example`.

```
OPENAI_API_KEY=sk-...
OPENAI_SUPPORT_AGENT_MODEL=gpt-4o-mini
OPENAI_SUPPORT_AGENT_ID=<filled automatically after first run>
```

> ℹ️ `OPENAI_SUPPORT_AGENT_ID` is managed by the setup script. The script will
> create the variable in `.env.local` if it does not already exist.

## Running the setup script

1. Install dependencies if needed: `pnpm install`
2. Export your API key or populate `.env.local`
3. Execute `pnpm setup:agent`

The script will:

- Load the system instructions and language policy verbatim from
  `docs/agents/support-agent/`
- Register (or update) the assistant with the latest tool schemas
- Persist the assistant ID to `.env.local`
- Print the assistant ID to stdout for audit logs

Set `DRY_RUN=1` to preview the payload without calling the API. This is useful
in CI or when reviewing diffs: `DRY_RUN=1 pnpm setup:agent`.

## Verifying the agent

After a successful run:

- Confirm `.env.local` now contains `OPENAI_SUPPORT_AGENT_ID`
- Visit the OpenAI dashboard and ensure the assistant name is
  `Ibimina SACCO+ Support` with the expected model and tools
- Run `pnpm exec tsx --test scripts/__tests__/setupAgent.test.ts` to validate
  the tool schema contract locally

## Incident response

If the agent configuration drifts:

1. Regenerate the configuration with `pnpm setup:agent`
2. Commit any updated prompt or tooling documents under
   `docs/agents/support-agent`
3. Re-deploy environments that rely on the assistant ID

Keep audit trails (timestamp, operator, agent ID) in the runbook notes when
running the script for production updates.
