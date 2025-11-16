# PR Conflict Resolution Guide for Codex AI Feature PRs

## Executive Summary

PRs #270, #305, and #307 are currently unmergeable due to fundamental
architectural differences between:

1. **Current main branch**: Simple orchestrator-based AI agent implementation
2. **PR branches**: Comprehensive implementation with embeddings, vector search,
   session management, and observability

These are not simple merge conflicts - they represent two competing
implementations that cannot be reconciled through standard conflict resolution.

## Problem Analysis

### PR #270: Sentry Observability, PostHog Funnels, and AI Guardrails

- **Base SHA**: `f5929f6ef002644dc53c4bee862f343440e2934a` (older)
- **Changes**: 22 files, +2351/-145
- **Key Features**:
  - Sentry integration with PII scrubbing
  - PostHog analytics
  - AI agent guardrails (inline implementation)
  - Streaming chat endpoint

### PR #305: AI Embedding Pipeline and Supabase Vector Schema

- **Base SHA**: `3088181e2cfe6d1db61394855fc80bddbf7512da` (newer)
- **Changes**: 15 files, +2024/-82
- **Key Features**:
  - OpenAI embedding provider
  - Vector store with pgvector
  - Knowledge base resolver
  - Document ingestion pipeline
  - Monitoring and reindex utilities

### PR #307: Durable AI Agent Sessions with Rate Limits

- **Base SHA**: `3088181e2cfe6d1db61394855fc80bddbf7512da` (newer)
- **Changes**: 22 files, +2044/-108
- **Key Features**:
  - Redis/Supabase session storage
  - Rate limiting (org/user/IP buckets)
  - Usage logging
  - Opt-out registry
  - Service role client utilities

### Current Main Branch Implementation

- **AI Agent Structure**: Orchestrator-based with separate tools, agents, and
  guardrails modules
- **Dependencies**: Only OpenAI SDK, uses vitest for testing
- **Approach**: Simple, modular design focusing on chat orchestration

## Architectural Incompatibility

The main issue is that `packages/ai-agent/src/` has completely different file
structures:

**Main branch:**

- `agents.ts` - Agent implementations
- `orchestrator.ts` - Orchestration logic
- `guardrails.ts` - Separate guardrails module
- `tools.ts` - Tool definitions
- `session.ts` - Simple session management

**PR branches:**

- PR #270: Inline `AIAgent` class with embedded guardrails
- PR #305: `embeddingProvider.ts`, `vectorStore.ts`, `resolver.ts`,
  `ingestion.ts`
- PR #307: `agent.ts`, `errors.ts`, `rate-limiter.ts`, `usage-logger.ts`,
  `opt-out-registry.ts`

## Recommended Resolution Strategy

### Option 1: Incremental Integration (Recommended)

Merge features incrementally while preserving main's architecture:

1. **Phase 1 - Observability Only** (from PR #270)
   - Extract and merge only Sentry + PostHog integrations
   - Keep existing AI agent orchestrator untouched
   - Add observability as wrapper layer

2. **Phase 2 - Session Management** (from PR #307)
   - Add session storage providers to `packages/providers`
   - Integrate rate limiting into existing orchestrator
   - Add usage logging hooks

3. **Phase 3 - Vector Search** (from PR #305)
   - Add embeddings as optional enhancement
   - Integrate vector store alongside existing tools
   - Make knowledge base search a new tool in orchestrator

**Advantages:**

- Preserves existing working implementation
- Allows gradual testing of each feature
- Maintains backward compatibility

**Disadvantages:**

- Requires significant refactoring of PR code
- Takes longer to deliver full feature set

### Option 2: Full Replacement (Higher Risk)

Replace main's AI agent implementation entirely with PR implementations:

1. Close or archive current main AI agent implementation
2. Merge PRs in sequence: #270 → #305 → #307
3. Update all consumers to use new API

**Advantages:**

- Gets full feature set immediately
- PRs can be merged largely as-is

**Disadvantages:**

- Breaking change for any existing consumers
- Higher risk of bugs
- All three PRs must work together perfectly

### Option 3: Parallel Implementation

Keep both implementations and choose which to use via feature flag:

1. Rename current implementation to `ai-agent-orchestrator`
2. Merge PR implementations as `ai-agent-rag`
3. Use environment variable to select implementation

**Advantages:**

- Zero downtime migration
- Can test new implementation in production
- Easy rollback if issues arise

**Disadvantages:**

- Doubled maintenance burden temporarily
- Code duplication

## Detailed Merge Steps (Option 2 - Full Replacement)

If you choose Option 2, follow these steps:

### Step 1: Backup and Clear Current Implementation

```bash
git checkout main
git checkout -b backup/ai-agent-orchestrator
git push origin backup/ai-agent-orchestrator

git checkout main
git rm -r packages/ai-agent/src/agents.ts
git rm -r packages/ai-agent/src/orchestrator.ts
git rm -r packages/ai-agent/src/guardrails.ts
git rm -r packages/ai-agent/src/tools.ts
git commit -m "chore: remove orchestrator-based AI agent in preparation for RAG implementation"
```

### Step 2: Merge PR #270 (Observability)

```bash
git fetch origin codex/integrate-sentry-with-pii-scrubbing
git merge --no-ff origin/codex/integrate-sentry-with-pii-scrubbing

# Conflicts to resolve:
# - apps/admin/app/api/chat/route.ts - Keep PR version
# - apps/admin/instrumentation.ts - Merge both Sentry configs
# - apps/admin/sentry.*.config.ts - Keep PR version
# - apps/platform-api/* - Keep PR Sentry setup
# - packages/lib/src/observability/* - Keep PR PII scrubbing

git add .
git commit -m "feat: integrate Sentry observability and PostHog from PR #270"
git push origin main
```

### Step 3: Merge PR #305 (Embeddings)

```bash
git fetch origin codex/define-schema-for-embeddings-in-supabase
git merge --no-ff origin/codex/define-schema-for-embeddings-in-supabase

# Conflicts to resolve:
# - packages/ai-agent/src/index.ts - Combine exports from #270 + #305
# - packages/ai-agent/package.json - Merge dependencies
# - supabase/migrations/* - Keep all new migrations

git add .
git commit -m "feat: add AI embedding pipeline and vector schema from PR #305"
git push origin main
```

### Step 4: Merge PR #307 (Session Storage)

```bash
git fetch origin codex/integrate-redis-for-session-storage
git merge --no-ff origin/codex/integrate-redis-for-session-storage

# Conflicts to resolve:
# - packages/ai-agent/src/* - Combine all modules
# - packages/providers/src/* - Add session storage
# - packages/config/src/env.ts - Merge all new env vars
# - .env.example - Add all AI agent configuration

git add .
git commit -m "feat: add durable sessions and rate limiting from PR #307"
git push origin main
```

### Step 5: Integration Testing

```bash
# Set test environment variables
export OPENAI_API_KEY=test-key
export SUPABASE_URL=test-url
export SUPABASE_SERVICE_ROLE_KEY=test-key
# ... all other required vars

# Run tests
pnpm --filter @ibimina/ai-agent test
pnpm --filter @ibimina/providers test
pnpm --filter @ibimina/admin test:unit

# Test chat endpoint
curl -X POST http://localhost:3100/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"org_id":"test","message":"Hello"}'
```

## Migration Guide for Consumers

If using Option 2, consumers need to update their imports:

### Before (Orchestrator API):

```typescript
import { bootstrapAgentSession, runAgentTurn } from "@ibimina/ai-agent";
import { evaluateGuardrails } from "@ibimina/ai-agent";
```

### After (RAG API):

```typescript
import { AIAgent } from "@ibimina/ai-agent";
import { createAgentSessionStore } from "@ibimina/providers";
import { SupabaseAgentRateLimiter } from "@ibimina/ai-agent";
```

## Environment Variables Required

Add these to `.env`:

```bash
# From PR #307
AI_AGENT_SESSION_STORE=supabase  # or "redis"
AI_AGENT_SESSION_TTL_SECONDS=3600
AI_AGENT_RATE_LIMIT_MAX_REQUESTS=60
AI_AGENT_RATE_LIMIT_WINDOW_SECONDS=60
AI_AGENT_USAGE_LOG_ENABLED=true
AI_AGENT_USAGE_LOG_TABLE=agent_usage_events
AI_AGENT_OPTOUT_TABLE=agent_opt_outs
AI_AGENT_REDIS_URL=redis://localhost:6379  # if using Redis

# From PR #305 (already in main)
OPENAI_API_KEY=your-key
```

## Database Migrations Required

Run these migrations in order:

1. `20251231110000_ai_embeddings_vector_store.sql` (from PR #305)
2. `20251231120000_ai_agent_sessions_usage.sql` (from PR #307)

```bash
cd supabase
supabase db push
```

## Testing Checklist

After merging:

- [ ] AI agent unit tests pass
- [ ] Session storage tests pass (both Supabase and Redis modes)
- [ ] Rate limiting works correctly
- [ ] Usage logging captures events
- [ ] Opt-out registry blocks requests
- [ ] Embedding ingestion pipeline works
- [ ] Vector search returns relevant results
- [ ] Sentry captures errors with PII scrubbed
- [ ] PostHog tracks user interactions
- [ ] Chat streaming endpoint works
- [ ] All environment variables are documented

## Rollback Plan

If issues arise:

```bash
# Revert to orchestrator implementation
git checkout backup/ai-agent-orchestrator -- packages/ai-agent
git commit -m "rollback: restore orchestrator-based AI agent"
git push origin main
```

## Conclusion

**Recommended Action**: Choose Option 1 (Incremental Integration) for lowest
risk, or Option 2 (Full Replacement) if you're confident in the PR
implementations and can afford downtime for testing.

**DO NOT** attempt to merge these PRs using standard GitHub merge - the
conflicts are too fundamental and will likely result in broken code.

**Next Steps**:

1. Review this document with the team
2. Decide on integration strategy (Option 1, 2, or 3)
3. Schedule a maintenance window if choosing Option 2
4. Follow the detailed merge steps above
5. Run comprehensive integration tests
6. Update all documentation and API consumers
