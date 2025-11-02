```mermaid
graph TD
    A[Main Branch<br/>Simple Orchestrator] -->|Cannot merge| B[PR #270<br/>Sentry + PostHog]
    A -->|Cannot merge| C[PR #305<br/>Embeddings + Vectors]
    A -->|Cannot merge| D[PR #307<br/>Sessions + Rate Limits]
    
    B --> E{Merge Conflict}
    C --> E
    D --> E
    
    E -->|❌ GitHub Merge<br/>Will Break| F[Broken Code]
    E -->|✅ Automated Script<br/>Full Replacement| G[Complete RAG System]
    E -->|✅ Manual Steps<br/>Incremental| H[Gradual Integration]
    
    G --> I[Production Ready AI Agent]
    H --> I
    
    I --> J[Features:<br/>- Vector Search<br/>- Session Management<br/>- Rate Limiting<br/>- Analytics<br/>- Observability]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#ff9,stroke:#333,stroke-width:2px
    style F fill:#f66,stroke:#333,stroke-width:2px
    style G fill:#6f6,stroke:#333,stroke-width:2px
    style H fill:#6f6,stroke:#333,stroke-width:2px
    style I fill:#6cf,stroke:#333,stroke-width:4px
    style J fill:#9cf,stroke:#333,stroke-width:2px
```

# Architecture Comparison

## Current Main Branch
```
packages/ai-agent/
├── src/
│   ├── orchestrator.ts     ← Orchestration logic
│   ├── agents.ts            ← Agent implementations
│   ├── tools.ts             ← Tool definitions
│   ├── guardrails.ts        ← Safety checks
│   └── session.ts           ← Simple session
└── tests/
    ├── orchestrator.test.ts
    └── guardrails.test.ts
```

**Characteristics:**
- Modular design
- Tool-based approach
- Simple session management
- Basic guardrails

## PR Branches (New Implementation)
```
packages/ai-agent/
├── src/
│   ├── agent.ts                  ← Core AI agent (PR #307)
│   ├── embeddingProvider.ts      ← OpenAI embeddings (PR #305)
│   ├── vectorStore.ts            ← pgvector integration (PR #305)
│   ├── resolver.ts               ← Knowledge base search (PR #305)
│   ├── ingestion.ts              ← Document processing (PR #305)
│   ├── monitoring.ts             ← Metrics (PR #305)
│   ├── rate-limiter.ts           ← Rate limiting (PR #307)
│   ├── usage-logger.ts           ← Analytics (PR #307)
│   ├── opt-out-registry.ts       ← User preferences (PR #307)
│   └── errors.ts                 ← Error types (PR #307)
└── tests/
    └── ai-agent.test.ts

packages/providers/
└── src/
    └── agent/
        └── session-store.ts      ← Redis/Supabase sessions (PR #307)

packages/lib/
└── src/
    └── observability/
        ├── sentry.ts             ← Sentry integration (PR #270)
        ├── pii.ts                ← PII scrubbing (PR #270)
        ├── posthog-edge.ts       ← PostHog client (PR #270)
        └── posthog-server.ts     ← PostHog server (PR #270)
```

**Characteristics:**
- Comprehensive RAG system
- Vector search capabilities
- Durable session storage
- Enterprise-grade rate limiting
- Full observability stack

# Conflict Resolution Flow

```mermaid
sequenceDiagram
    participant Maintainer
    participant Script as merge-ai-prs.sh
    participant Git
    participant Tests
    
    Maintainer->>Script: Run automated merge
    Script->>Git: Create backup branch
    Git-->>Script: backup/ai-agent-orchestrator-20251102
    
    Script->>Git: Remove orchestrator files
    Git-->>Script: Committed
    
    Script->>Git: Merge PR #270
    Git-->>Script: Conflicts detected
    Script->>Git: Resolve with --theirs
    Git-->>Script: PR #270 merged
    
    Script->>Git: Merge PR #305
    Git-->>Script: Conflicts detected
    Script->>Git: Resolve with --theirs
    Git-->>Script: PR #305 merged
    
    Script->>Git: Merge PR #307
    Git-->>Script: Conflicts detected
    Script->>Git: Resolve with --theirs
    Git-->>Script: PR #307 merged
    
    Script->>Tests: Run test suite
    Tests-->>Script: Results
    
    Script->>Maintainer: Merge complete!
    Script->>Maintainer: Next: Run migrations
    Script->>Maintainer: Next: Update env vars
    Script->>Maintainer: Next: Test endpoint
```

# Database Schema Changes

## PR #305: Vector Store
```sql
-- New tables for RAG system
CREATE TABLE ai_documents (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations,
  title TEXT,
  checksum TEXT,
  token_count INTEGER,
  ...
);

CREATE TABLE ai_document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES ai_documents,
  content TEXT,
  embedding VECTOR(1536),  -- pgvector type
  ...
);

-- Similarity search function
CREATE FUNCTION match_ai_document_chunks(
  query_embedding VECTOR(1536),
  match_count INT,
  ...
) RETURNS TABLE (...);
```

## PR #307: Session Management
```sql
-- New tables for agent runtime
CREATE TABLE agent_sessions (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations,
  user_id UUID REFERENCES auth.users,
  messages JSONB,
  expires_at TIMESTAMPTZ,
  ...
);

CREATE TABLE agent_usage_events (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES agent_sessions,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost_usd NUMERIC,
  ...
);

CREATE TABLE agent_opt_outs (
  id UUID PRIMARY KEY,
  org_id UUID,
  user_id UUID,
  channel TEXT,
  ...
);
```

# Environment Variables

## New Configuration (from PR #307)
```bash
# Session Storage
AI_AGENT_SESSION_STORE=supabase        # or "redis"
AI_AGENT_SESSION_TTL_SECONDS=3600
AI_AGENT_REDIS_URL=redis://...         # if using Redis

# Rate Limiting
AI_AGENT_RATE_LIMIT_MAX_REQUESTS=60
AI_AGENT_RATE_LIMIT_WINDOW_SECONDS=60

# Analytics
AI_AGENT_USAGE_LOG_ENABLED=true
AI_AGENT_USAGE_LOG_TABLE=agent_usage_events
AI_AGENT_OPTOUT_TABLE=agent_opt_outs
```

## Existing (required)
```bash
OPENAI_API_KEY=your-key
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```
