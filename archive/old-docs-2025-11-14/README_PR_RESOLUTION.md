# Unmergeable PRs Resolution

## Summary

This documents the resolution of unmergeable PRs #270, #305, and #307, which
implement the "codex" AI feature initiative.

## Problem

Three pull requests are marked as unmergeable (`mergeable: false`,
`mergeable_state: "dirty"`):

- **PR #270**: Add Sentry observability, PostHog funnels, and AI guardrails (22
  files, +2351/-145)
- **PR #305**: Add AI embedding pipeline and Supabase vector schema (15 files,
  +2024/-82)
- **PR #307**: Add durable AI agent sessions with rate limits (22 files,
  +2044/-108)

### Root Causes

1. **Divergent Base SHAs**: PRs branched from different points in history
2. **Architectural Incompatibility**: Two fundamentally different AI agent
   implementations
   - **Main branch**: Simple orchestrator-based approach
   - **PR branches**: Comprehensive RAG system with embeddings, vector search,
     session management
3. **Overlapping Files**: All three PRs modify `packages/ai-agent/*` with
   conflicting implementations

## Solution

This repository now contains comprehensive resolution documentation and tooling:

### 📋 Documentation

#### [PR_CONFLICT_RESOLUTION_GUIDE.md](./PR_CONFLICT_RESOLUTION_GUIDE.md)

Comprehensive guide with three integration strategies:

- **Option 1**: Incremental Integration (recommended for safety)
- **Option 2**: Full Replacement (fastest path to full features)
- **Option 3**: Parallel Implementation (gradual migration)

Includes:

- Detailed analysis of each PR
- Step-by-step merge instructions
- Migration guide for API consumers
- Environment variable requirements
- Database migration checklist
- Testing procedures
- Rollback plan

### 🔧 Automation

#### [scripts/merge-ai-prs.sh](./scripts/merge-ai-prs.sh)

Automated merge script implementing Option 2 (Full Replacement):

- Backs up current implementation
- Removes orchestrator-based code
- Merges PRs sequentially with conflict resolution
- Regenerates lockfiles
- Runs test suite
- Provides post-merge checklist

**Usage:**

```bash
./scripts/merge-ai-prs.sh
```

## Quick Start

### For Repository Maintainers

1. **Review the strategy guide**:

   ```bash
   cat PR_CONFLICT_RESOLUTION_GUIDE.md
   ```

2. **Choose your integration approach**:
   - **Safe & Gradual**: Follow Option 1 in the guide
   - **Fast & Complete**: Run the automated script:
     ```bash
     ./scripts/merge-ai-prs.sh
     ```

3. **Post-merge steps**:
   - Run database migrations
   - Update environment variables
   - Test the chat endpoint
   - Update documentation for API consumers

### For Developers

If you're consuming the AI agent package:

**Current API (will be deprecated):**

```typescript
import { bootstrapAgentSession, runAgentTurn } from "@ibimina/ai-agent";
```

**New API (after merge):**

```typescript
import { AIAgent } from "@ibimina/ai-agent";
import { createAgentSessionStore } from "@ibimina/providers";
```

See migration guide in
[PR_CONFLICT_RESOLUTION_GUIDE.md](./PR_CONFLICT_RESOLUTION_GUIDE.md#migration-guide-for-consumers).

## Key Files

```
.
├── PR_CONFLICT_RESOLUTION_GUIDE.md   # Comprehensive resolution guide
├── README_PR_RESOLUTION.md            # This file
├── scripts/
│   └── merge-ai-prs.sh                # Automated merge script
└── packages/ai-agent/
    ├── Current (main branch):
    │   ├── orchestrator.ts            # Will be replaced
    │   ├── agents.ts                  # Will be replaced
    │   └── guardrails.ts              # Will be replaced
    └── Incoming (from PRs):
        ├── agent.ts                   # New implementation
        ├── embeddingProvider.ts       # Vector search
        ├── vectorStore.ts             # pgvector integration
        ├── rate-limiter.ts            # Rate limiting
        └── usage-logger.ts            # Analytics
```

## What's Different?

### Current Implementation (main branch)

- **Architecture**: Orchestrator pattern with separate modules
- **Features**: Basic chat with tools and guardrails
- **Dependencies**: Only OpenAI SDK
- **Testing**: Vitest

### New Implementation (from PRs)

- **Architecture**: Comprehensive RAG system
- **Features**:
  - Vector search with pgvector
  - Redis/Supabase session storage
  - Rate limiting (org/user/IP)
  - Usage logging and analytics
  - Opt-out registry
  - Sentry error tracking with PII scrubbing
  - PostHog analytics
- **Dependencies**: OpenAI SDK, Supabase, Redis (optional), Sentry, PostHog
- **Testing**: tsx test runner

## Database Migrations

The PRs include two new migrations:

1. **20251231110000_ai_embeddings_vector_store.sql** (PR #305)
   - Creates `ai_documents` table
   - Creates `ai_document_chunks` table with vector embeddings
   - Adds `match_ai_document_chunks()` function for similarity search
   - Enables pgvector extension

2. **20251231120000_ai_agent_sessions_usage.sql** (PR #307)
   - Creates `agent_sessions` table
   - Creates `agent_usage_events` table for analytics
   - Creates `agent_opt_outs` table for user preferences
   - Adds RLS policies

**Apply migrations:**

```bash
cd supabase
supabase db push
```

## Environment Variables

Add to `.env`:

```bash
# AI Agent Configuration (PR #307)
AI_AGENT_SESSION_STORE=supabase           # or "redis"
AI_AGENT_SESSION_TTL_SECONDS=3600
AI_AGENT_RATE_LIMIT_MAX_REQUESTS=60
AI_AGENT_RATE_LIMIT_WINDOW_SECONDS=60
AI_AGENT_USAGE_LOG_ENABLED=true
AI_AGENT_USAGE_LOG_TABLE=agent_usage_events
AI_AGENT_OPTOUT_TABLE=agent_opt_outs
AI_AGENT_REDIS_URL=redis://localhost:6379  # Optional, if using Redis

# OpenAI (required)
OPENAI_API_KEY=your-key-here
```

## Testing

After merging:

```bash
# Run AI agent tests
pnpm --filter @ibimina/ai-agent test

# Run providers tests (session storage)
pnpm --filter @ibimina/providers test

# Type check
pnpm typecheck

# Test chat endpoint
curl -X POST http://localhost:3100/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "org_id": "test-org",
    "message": "What are SACCO loan requirements?"
  }'
```

## Rollback

If issues arise after merging:

```bash
# A backup branch was automatically created
git checkout backup/ai-agent-orchestrator-YYYYMMDD

# Cherry-pick the old implementation back
git checkout backup/ai-agent-orchestrator-YYYYMMDD -- packages/ai-agent
git commit -m "rollback: restore orchestrator-based AI agent"
git push origin main
```

## FAQ

### Why can't these PRs be merged normally?

The PRs contain fundamentally different implementations of the AI agent.
Standard merge would create broken, non-functional code.

### Which implementation is better?

The PR implementation is more feature-complete with vector search, session
management, rate limiting, and observability. The main branch implementation is
simpler but less capable.

### Do I have to merge all three PRs?

Yes, they're interdependent:

- PR #270 provides observability infrastructure
- PR #305 adds embeddings and vector search
- PR #307 adds session management and rate limiting

All three work together as a cohesive system.

### What if I only want some features?

Follow Option 1 (Incremental Integration) in the guide to cherry-pick specific
features while keeping the current architecture.

### Will this break existing code?

Yes, if you're using the AI agent package. The API changes from
orchestrator-based to class-based. See the migration guide.

## Next Steps

1. ✅ Read [PR_CONFLICT_RESOLUTION_GUIDE.md](./PR_CONFLICT_RESOLUTION_GUIDE.md)
2. ⚙️ Choose integration strategy (Option 1, 2, or 3)
3. 🔀 Execute merge (manually or via script)
4. 🗄️ Run database migrations
5. 🧪 Run integration tests
6. 📚 Update API consumer documentation
7. 🚀 Deploy

## Support

For questions or issues during merge:

- Review the detailed guide:
  [PR_CONFLICT_RESOLUTION_GUIDE.md](./PR_CONFLICT_RESOLUTION_GUIDE.md)
- Check the automated script logs: `./scripts/merge-ai-prs.sh`
- Consult the backup branch if rollback is needed

---

**Created**: 2025-11-02  
**Author**: GitHub Copilot Coding Agent  
**Issue**: #XXX (Unmergeable PRs #270, #305, #307)
