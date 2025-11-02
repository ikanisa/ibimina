# Testing Guide for Merged AI Features

This guide helps verify that PRs #270, #305, and #307 were merged successfully and all features work correctly.

## Prerequisites

Before testing, ensure:

1. ✅ All three PRs have been merged
2. ✅ Database migrations have been run
3. ✅ Environment variables are configured
4. ✅ Dependencies are installed (`pnpm install`)

## Quick Health Check

Run this first to verify basic setup:

```bash
# Check all required environment variables are set
./scripts/check-env.sh

# Run typecheck
pnpm typecheck

# Run linter
pnpm lint
```

## Test Suite 1: Unit Tests

### AI Agent Package
```bash
cd packages/ai-agent
pnpm test

# Expected output:
# ✓ creates new session and stores messages
# ✓ reuses existing session history
# ✓ enforces rate limiter for org, user, and ip
# ✓ blocks requests when opt-out registry denies access
# ✓ validates non-empty message content
```

### Providers Package (Session Storage)
```bash
cd packages/providers
pnpm test

# Expected output:
# ✓ redis session store persists and loads sessions
# ✓ redis session store touch refreshes ttl
# ✓ supabase session store saves, loads, and deletes sessions
```

### AI Agent with Embeddings (PR #305)
```bash
cd packages/ai-agent
pnpm test -- ingestion

# Expected output:
# ✓ ingests documents and stores chunk embeddings
# ✓ reindexes existing chunks with fresh embeddings
# ✓ resolves vector matches with high similarity
# ✓ falls back to keyword search when embeddings fail
# ✓ returns contextual matches from the chat API
```

## Test Suite 2: Integration Tests

### Database Schema Validation

```bash
# Connect to database
psql $DATABASE_URL

# Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%' OR table_name LIKE 'agent_%';

# Expected tables:
# - ai_documents
# - ai_document_chunks
# - ai_ingestion_jobs
# - ai_reindex_events
# - agent_sessions
# - agent_usage_events
# - agent_opt_outs
```

### Vector Search Function

```sql
-- Test the similarity search function
SELECT * FROM match_ai_document_chunks(
  ARRAY[0.1, 0.2, ..., 0.1]::vector(1536),  -- Test embedding
  5,                                          -- Match count
  0.5,                                        -- Threshold
  NULL                                        -- Org filter
);

-- Should return empty result set (no documents yet)
```

### Session Storage

```bash
# Start test server
pnpm dev

# In another terminal, create a test session
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "org_id": "test-org-123",
    "user_id": "test-user-456",
    "message": "Hello, I need help with SACCO loans",
    "channel": "web"
  }'

# Expected response:
# {
#   "session_id": "uuid-here",
#   "message": "...",
#   "messages": [...],
#   "usage": {
#     "promptTokens": 12,
#     "completionTokens": 32,
#     "totalTokens": 44
#   },
#   "model": "gpt-4o-mini",
#   "createdAt": "2025-11-02T..."
# }

# Verify session was stored
psql $DATABASE_URL -c "SELECT * FROM agent_sessions WHERE id = 'session-id-from-response';"
```

### Rate Limiting

```bash
# Send multiple requests rapidly
for i in {1..65}; do
  curl -X POST http://localhost:3000/api/agent/chat \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{\"org_id\":\"test-org\",\"message\":\"Request $i\"}" &
done
wait

# After 60 requests, should receive 429 error:
# {
#   "error": "rate_limit",
#   "message": "Rate limit exceeded",
#   "details": {
#     "bucketKey": "org:test-org",
#     "maxHits": 60,
#     "windowSeconds": 60
#   }
# }
```

### Usage Logging

```bash
# Make a few chat requests
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"org_id":"test-org","message":"Test 1"}'

curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"org_id":"test-org","message":"Test 2"}'

# Verify usage was logged
psql $DATABASE_URL -c "
  SELECT 
    org_id, 
    channel, 
    model, 
    prompt_tokens, 
    completion_tokens,
    total_tokens,
    cost_usd,
    latency_ms,
    success
  FROM agent_usage_events 
  ORDER BY created_at DESC 
  LIMIT 5;
"

# Should show recent usage events with token counts
```

### Opt-Out Registry

```bash
# Create an opt-out record
psql $DATABASE_URL -c "
  INSERT INTO agent_opt_outs (org_id, user_id, channel, reason)
  VALUES ('test-org', 'test-user-456', 'web', 'Testing opt-out');
"

# Try to make a chat request with opted-out user
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "org_id": "test-org",
    "user_id": "test-user-456",
    "message": "This should be blocked",
    "channel": "web"
  }'

# Expected response (403):
# {
#   "error": "opt_out",
#   "message": "AI assistant is disabled for this user",
#   "details": {
#     "orgId": "test-org",
#     "userId": "test-user-456",
#     "channel": "web"
#   }
# }

# Clean up
psql $DATABASE_URL -c "DELETE FROM agent_opt_outs WHERE org_id = 'test-org';"
```

## Test Suite 3: Observability (PR #270)

### Sentry Integration

```bash
# Make a request that will cause an error
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "org_id": "test-org",
    "message": "Test with invalid data: email@example.com, phone: +250788123456"
  }'

# Check Sentry dashboard (https://sentry.io)
# Verify:
# ✓ Error was captured
# ✓ PII was scrubbed (email shows as em••••@example.com)
# ✓ Phone number was scrubbed (shows as +2••••56)
```

### PostHog Analytics

```bash
# Make successful requests
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"org_id":"test-org","message":"Analytics test"}'

# Check PostHog dashboard
# Verify:
# ✓ Event "ai_agent_chat" was captured
# ✓ Properties include: org_id, channel, model, tokens
# ✓ Funnel tracks: message_sent → response_received
```

## Test Suite 4: Embedding Pipeline (PR #305)

### Document Ingestion

```typescript
// Create test script: scripts/test-ingestion.ts
import {
  EmbeddingIngestionPipeline,
  OpenAIEmbeddingProvider,
  SupabaseVectorStore,
} from "@ibimina/ai-agent";

const provider = new OpenAIEmbeddingProvider({
  apiKey: process.env.OPENAI_API_KEY!,
});

const store = SupabaseVectorStore.fromEnv();
const pipeline = new EmbeddingIngestionPipeline(store, provider);

const testDoc = {
  orgId: "test-org",
  title: "SACCO Loan Requirements",
  content: "To apply for a SACCO loan, members must have maintained regular savings for at least 6 months...",
  sourceType: "manual",
  sourceUri: "https://kb.example.com/loans",
  createdBy: "test-user",
};

const results = await pipeline.ingest([testDoc]);
console.log("Ingestion results:", results);

// Expected:
// {
//   documentId: "uuid",
//   jobId: "uuid",
//   chunkCount: 3,
//   tokenCount: 150,
//   checksum: "sha256-hash",
//   status: "completed"
// }
```

Run it:
```bash
tsx scripts/test-ingestion.ts
```

### Vector Search

```typescript
// scripts/test-vector-search.ts
import {
  KnowledgeBaseResolver,
  OpenAIEmbeddingProvider,
  SupabaseVectorStore,
} from "@ibimina/ai-agent";

const provider = new OpenAIEmbeddingProvider({
  apiKey: process.env.OPENAI_API_KEY!,
});

const store = SupabaseVectorStore.fromEnv();
const resolver = new KnowledgeBaseResolver(store, provider);

const result = await resolver.search("What are the loan requirements?", {
  orgId: "test-org",
  matchCount: 3,
});

console.log("Search results:", result);

// Expected:
// {
//   source: "vector",
//   matches: [
//     {
//       documentId: "uuid",
//       chunkId: "uuid",
//       content: "To apply for a SACCO loan...",
//       similarity: 0.87,
//       title: "SACCO Loan Requirements"
//     }
//   ]
// }
```

Run it:
```bash
tsx scripts/test-vector-search.ts
```

### Reindexing

```bash
# Reindex all documents
pnpm --filter @ibimina/ai-agent reindex

# Reindex specific org
pnpm --filter @ibimina/ai-agent reindex --org=test-org

# Reindex specific documents
pnpm --filter @ibimina/ai-agent reindex --document=doc-id-1,doc-id-2

# Expected output:
# Reindexed 5 documents and refreshed 23 chunks successfully.
```

## Test Suite 5: End-to-End Workflow

Complete workflow test:

```bash
#!/bin/bash
# scripts/e2e-test.sh

set -e

echo "1. Ingesting test documents..."
tsx scripts/test-ingestion.ts

echo "2. Testing vector search..."
tsx scripts/test-vector-search.ts

echo "3. Creating chat session..."
SESSION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "org_id": "test-org",
    "message": "What are the loan requirements?"
  }')

SESSION_ID=$(echo $SESSION_RESPONSE | jq -r '.session_id')
echo "Session created: $SESSION_ID"

echo "4. Continuing conversation..."
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{
    \"org_id\": \"test-org\",
    \"session_id\": \"$SESSION_ID\",
    \"message\": \"How long must I have been a member?\"
  }"

echo "5. Verifying session persisted..."
psql $DATABASE_URL -c "SELECT id, messages FROM agent_sessions WHERE id = '$SESSION_ID';"

echo "6. Verifying usage logged..."
psql $DATABASE_URL -c "
  SELECT session_id, total_tokens, latency_ms, success 
  FROM agent_usage_events 
  WHERE session_id = '$SESSION_ID';
"

echo "✅ E2E test complete!"
```

Run it:
```bash
chmod +x scripts/e2e-test.sh
./scripts/e2e-test.sh
```

## Performance Benchmarks

Expected performance metrics:

| Metric | Target | Acceptable Range |
|--------|--------|------------------|
| Chat Response Time (cold) | < 2s | 1.5s - 3s |
| Chat Response Time (warm) | < 1s | 0.5s - 1.5s |
| Vector Search | < 500ms | 200ms - 800ms |
| Session Save | < 100ms | 50ms - 200ms |
| Rate Limit Check | < 50ms | 10ms - 100ms |
| Embedding Generation (1 doc) | < 3s | 2s - 5s |

Run benchmarks:
```bash
# Install Apache Bench if needed
# sudo apt-get install apache2-utils

# Benchmark chat endpoint
ab -n 100 -c 10 -p test-payload.json -T application/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/agent/chat

# Expected results:
# Requests per second: > 20
# Mean time per request: < 500ms
# 95th percentile: < 1000ms
```

## Cleanup

After testing:

```bash
# Remove test data
psql $DATABASE_URL -c "
  DELETE FROM agent_usage_events WHERE org_id = 'test-org';
  DELETE FROM agent_sessions WHERE org_id = 'test-org';
  DELETE FROM ai_documents WHERE org_id = 'test-org';
  DELETE FROM agent_opt_outs WHERE org_id = 'test-org';
"

# Stop test server
pkill -f "pnpm dev"
```

## Troubleshooting

### Tests Fail: "OPENAI_API_KEY is not configured"
**Solution**: Ensure environment variable is set
```bash
export OPENAI_API_KEY=your-key-here
```

### Tests Fail: "Failed to connect to Supabase"
**Solution**: Check Supabase credentials
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

### Tests Fail: "Redis connection refused"
**Solution**: Either start Redis or switch to Supabase mode
```bash
# Option 1: Start Redis
docker run -d -p 6379:6379 redis

# Option 2: Use Supabase for sessions
export AI_AGENT_SESSION_STORE=supabase
```

### Vector Search Returns No Results
**Solution**: Ingest test documents first
```bash
tsx scripts/test-ingestion.ts
```

### Rate Limiting Not Working
**Solution**: Clear rate limit buckets
```sql
DELETE FROM ops.rate_limits WHERE bucket_key LIKE 'org:%' OR bucket_key LIKE 'user:%';
```

## Success Criteria

✅ All unit tests pass  
✅ All integration tests pass  
✅ Chat endpoint returns responses  
✅ Sessions persist across requests  
✅ Rate limiting blocks after threshold  
✅ Usage events are logged  
✅ Opt-outs are respected  
✅ Vector search returns relevant results  
✅ Sentry captures errors with PII scrubbed  
✅ PostHog tracks analytics  
✅ Performance meets benchmarks  

## Next Steps

After all tests pass:
1. Deploy to staging environment
2. Run smoke tests in staging
3. Monitor Sentry and PostHog dashboards
4. Deploy to production
5. Monitor for 24 hours
6. Update documentation

---

**Need help?** See [PR_CONFLICT_RESOLUTION_GUIDE.md](./PR_CONFLICT_RESOLUTION_GUIDE.md) for troubleshooting and rollback procedures.
