# AI Agent Operations Guide

This guide documents how the Ibimina AI assistant stores conversations, enforces
rate limits, tracks token usage, and responds to runtime failures. Use these
procedures when rolling out the assistant to new tenants or debugging incidents.

## Session Storage Backends

The agent persists chat history through the `@ibimina/providers` session store.
You can select a backend with `AI_AGENT_SESSION_STORE`:

| Backend              | When to use                                                                           | Notes                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `supabase` (default) | Standard deployments that rely on Postgres durability and Supabase security policies. | Sessions live in `public.agent_sessions`. TTL is controlled by `AI_AGENT_SESSION_TTL_SECONDS`.              |
| `redis`              | High-throughput or low-latency workloads where short-lived context is acceptable.     | Requires `AI_AGENT_REDIS_URL`. TTL is managed in Redis using the same `AI_AGENT_SESSION_TTL_SECONDS` value. |

Switching drivers only changes the persistence layer; no code changes are
required. When Redis is enabled, ensure the connection string uses TLS for
production workloads (e.g. `rediss://`).

## Rate Limiting

The chat endpoint (`/api/agent/chat`) enforces Supabase-backed rate limits
through `AI_AGENT_RATE_LIMIT_MAX_REQUESTS` and
`AI_AGENT_RATE_LIMIT_WINDOW_SECONDS`. Each request consumes budget for:

- `org:{orgId}` – protects organization-wide quotas.
- `user:{userId}` – prevents individual spam.
- `ip:{clientIp}` – defends against anonymous floods.

If you need to throttle specific channels (e.g. WhatsApp), lower
`AI_AGENT_RATE_LIMIT_MAX_REQUESTS` or increase the window. Rate-limit events are
stored in `ops.rate_limits`; clear a bucket with:

```sql
select * from ops.rate_limits where bucket_key = 'user:00000000-0000-0000-0000-000000000000';
```

## Usage Logging & Cost Tracking

Every interaction is recorded in `public.agent_usage_events`. Key columns:

- `prompt_tokens`, `completion_tokens`, `total_tokens` – raw OpenAI token usage.
- `latency_ms` – end-to-end response time.
- `success`, `error_code` – whether the request completed.
- `metadata` – JSON payload (rate-limit keys, IP address).

The table powers operations dashboards and cost reports. A quick monthly cost
estimate (assuming GPT-4.1 mini at $0.30 / 1M input tokens and $1.20 / 1M output
tokens) can be produced with:

```sql
select
  date_trunc('month', created_at) as month,
  sum(coalesce(prompt_tokens, 0)) as prompt_tokens,
  sum(coalesce(completion_tokens, 0)) as completion_tokens,
  sum(coalesce(prompt_tokens, 0)) * 0.0000003
    + sum(coalesce(completion_tokens, 0)) * 0.0000012 as estimated_usd
from public.agent_usage_events
where success is true
group by 1
order by 1 desc;
```

Disable logging temporarily with `AI_AGENT_USAGE_LOG_ENABLED=false` (for example
in load tests), but re-enable for production monitoring.

## Opt-Out Registry

User or organization level opt-outs live in `public.agent_opt_outs`. Each row
can cover:

- an entire organization (`org_id` with `user_id` NULL)
- a specific member (`org_id` + `user_id`)
- an optional channel (`channel` column)

The API rejects chat requests when an active opt-out exists. Staff can manage
opt-outs through SQL or future admin tooling. Expired records are ignored but
kept for audit.

## Failure Handling Runbook

| Symptom                    | Resolution Checklist                                                                                                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 429 `rate_limit` responses | 1. Inspect `ops.rate_limits` for offending keys.<br>2. Verify `AI_AGENT_RATE_LIMIT_*` values; temporarily raise thresholds if necessary.<br>3. Confirm batch jobs or automation are not reusing the same session ID.                  |
| 403 `opt_out` errors       | 1. Query `public.agent_opt_outs` for the org/user/channel.<br>2. Remove or expire the record if the user requests re-enablement.<br>3. Verify opt-out policies still reflect compliance requirements.                                 |
| `openai_error` (502)       | 1. Check OpenAI status dashboard.<br>2. Review `agent_usage_events.error_message` for upstream detail.<br>3. Retry manually; if persistent, fail over to human support and mute notifications via `AI_AGENT_USAGE_LOG_ENABLED=false`. |
| Session load/save failures | 1. Ensure Supabase connectivity or Redis availability.<br>2. Confirm `AI_AGENT_SESSION_STORE` matches the deployed infrastructure.<br>3. For Supabase, run migrations (`20251231120000_ai_agent_sessions_usage.sql`).                 |

## Monitoring Checklist

1. **Supabase tables**: `agent_sessions`, `agent_usage_events`, and
   `agent_opt_outs` should appear after migrations.
2. **Dashboards**: Build charts off `agent_usage_events` to track latency, token
   usage, and failure rates.
3. **Alerting**: Create alerts when estimated spend exceeds agreed budgets or
   when success rate drops below 98% in any 15-minute window.
