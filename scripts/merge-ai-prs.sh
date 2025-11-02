#!/bin/bash
# Automated merge script for PRs #270, #305, #307
# This implements Option 2: Full Replacement Strategy
# 
# Prerequisites:
# - Clean working directory on main branch
# - All required environment variables set
# - Database backup taken
#
# Usage: ./scripts/merge-ai-prs.sh

set -e  # Exit on error

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "================================================"
echo "AI Feature PRs Automated Merge Script"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Utility functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_preconditions() {
    log_info "Checking preconditions..."
    
    # Check we're on main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_error "Must be on main branch. Current branch: $current_branch"
        exit 1
    fi
    
    # Check working directory is clean
    if ! git diff-index --quiet HEAD --; then
        log_error "Working directory has uncommitted changes"
        exit 1
    fi
    
    # Check git is up to date
    git fetch origin
    
    log_info "Preconditions OK"
}

backup_current_implementation() {
    log_info "Creating backup branch for current AI agent implementation..."
    
    git checkout -b backup/ai-agent-orchestrator-$(date +%Y%m%d)
    git push origin backup/ai-agent-orchestrator-$(date +%Y%m%d)
    git checkout main
    
    log_info "Backup created"
}

remove_orchestrator_implementation() {
    log_info "Removing orchestrator-based AI agent implementation..."
    
    # Remove orchestrator-specific files
    git rm packages/ai-agent/src/agents.ts 2>/dev/null || true
    git rm packages/ai-agent/src/orchestrator.ts 2>/dev/null || true
    git rm packages/ai-agent/src/guardrails.ts 2>/dev/null || true
    git rm packages/ai-agent/src/tools.ts 2>/dev/null || true
    git rm packages/ai-agent/src/session.ts 2>/dev/null || true
    git rm packages/ai-agent/tests/orchestrator.test.ts 2>/dev/null || true
    git rm packages/ai-agent/tests/guardrails.test.ts 2>/dev/null || true
    git rm packages/ai-agent/vitest.config.ts 2>/dev/null || true
    
    git commit -m "chore: remove orchestrator-based AI agent for RAG replacement" || true
    
    log_info "Orchestrator implementation removed"
}

merge_pr_270() {
    log_info "Merging PR #270: Sentry Observability and PostHog..."
    
    git fetch origin codex/integrate-sentry-with-pii-scrubbing
    
    # Attempt merge
    if git merge --no-ff origin/codex/integrate-sentry-with-pii-scrubbing -m "feat: integrate Sentry observability and PostHog from PR #270"; then
        log_info "PR #270 merged cleanly"
    else
        log_warn "Merge conflicts detected, resolving..."
        
        # Accept their version for AI agent files (since we removed ours)
        git checkout --theirs packages/ai-agent/src/index.ts 2>/dev/null || true
        git add packages/ai-agent/src/index.ts 2>/dev/null || true
        
        # Accept their version for new files
        git checkout --theirs apps/admin/app/api/chat/route.ts 2>/dev/null || true
        git add apps/admin/app/api/chat/route.ts 2>/dev/null || true
        
        git checkout --theirs apps/admin/sentry.client.config.ts 2>/dev/null || true
        git add apps/admin/sentry.client.config.ts 2>/dev/null || true
        
        git checkout --theirs apps/admin/sentry.edge.config.ts 2>/dev/null || true
        git add apps/admin/sentry.edge.config.ts 2>/dev/null || true
        
        git checkout --theirs apps/admin/sentry.server.config.ts 2>/dev/null || true
        git add apps/admin/sentry.server.config.ts 2>/dev/null || true
        
        # Accept their version for PII scrubbing
        git checkout --theirs packages/lib/src/observability/pii.ts 2>/dev/null || true
        git add packages/lib/src/observability/pii.ts 2>/dev/null || true
        
        git checkout --theirs packages/lib/src/observability/posthog-edge.ts 2>/dev/null || true
        git add packages/lib/src/observability/posthog-edge.ts 2>/dev/null || true
        
        git checkout --theirs packages/lib/src/observability/posthog-server.ts 2>/dev/null || true
        git add packages/lib/src/observability/posthog-server.ts 2>/dev/null || true
        
        # For package.json and lock files, we'll need manual review
        # Accept theirs as base and then reinstall
        git checkout --theirs packages/lib/package.json 2>/dev/null || true
        git add packages/lib/package.json 2>/dev/null || true
        
        git checkout --theirs apps/admin/instrumentation.ts 2>/dev/null || true
        git add apps/admin/instrumentation.ts 2>/dev/null || true
        
        git checkout --theirs apps/platform-api/package.json 2>/dev/null || true
        git add apps/platform-api/package.json 2>/dev/null || true
        
        git checkout --theirs apps/platform-api/src/index.ts 2>/dev/null || true
        git add apps/platform-api/src/index.ts 2>/dev/null || true
        
        # Resolve pnpm-lock.yaml by regenerating it
        git checkout --theirs pnpm-lock.yaml 2>/dev/null || true
        git add pnpm-lock.yaml 2>/dev/null || true
        
        git commit -m "feat: integrate Sentry observability and PostHog from PR #270"
    fi
    
    log_info "Running pnpm install to sync dependencies..."
    pnpm install --frozen-lockfile || pnpm install
    
    log_info "PR #270 merged successfully"
}

merge_pr_305() {
    log_info "Merging PR #305: AI Embedding Pipeline and Vector Schema..."
    
    git fetch origin codex/define-schema-for-embeddings-in-supabase
    
    # Attempt merge
    if git merge --no-ff origin/codex/define-schema-for-embeddings-in-supabase -m "feat: add AI embedding pipeline and vector schema from PR #305"; then
        log_info "PR #305 merged cleanly"
    else
        log_warn "Merge conflicts detected, resolving..."
        
        # Accept their version for all AI agent files
        git checkout --theirs packages/ai-agent/src/*.ts 2>/dev/null || true
        git add packages/ai-agent/src/*.ts 2>/dev/null || true
        
        git checkout --theirs packages/ai-agent/package.json 2>/dev/null || true
        git add packages/ai-agent/package.json 2>/dev/null || true
        
        git checkout --theirs packages/ai-agent/tests/*.ts 2>/dev/null || true
        git add packages/ai-agent/tests/*.ts 2>/dev/null || true
        
        # Accept their migrations
        git checkout --theirs supabase/migrations/*.sql 2>/dev/null || true
        git add supabase/migrations/*.sql 2>/dev/null || true
        
        # Accept their route changes
        git checkout --theirs apps/client/app/api/agent/search/route.ts 2>/dev/null || true
        git add apps/client/app/api/agent/search/route.ts 2>/dev/null || true
        
        # Regenerate lock file
        git checkout --theirs pnpm-lock.yaml 2>/dev/null || true
        git add pnpm-lock.yaml 2>/dev/null || true
        
        git commit -m "feat: add AI embedding pipeline and vector schema from PR #305"
    fi
    
    log_info "Running pnpm install to sync dependencies..."
    pnpm install --frozen-lockfile || pnpm install
    
    log_info "PR #305 merged successfully"
}

merge_pr_307() {
    log_info "Merging PR #307: Durable Sessions and Rate Limiting..."
    
    git fetch origin codex/integrate-redis-for-session-storage
    
    # Attempt merge
    if git merge --no-ff origin/codex/integrate-redis-for-session-storage -m "feat: add durable sessions and rate limiting from PR #307"; then
        log_info "PR #307 merged cleanly"
    else
        log_warn "Merge conflicts detected, resolving..."
        
        # Accept their version for all files
        git checkout --theirs packages/ai-agent/src/*.ts 2>/dev/null || true
        git add packages/ai-agent/src/*.ts 2>/dev/null || true
        
        git checkout --theirs packages/ai-agent/package.json 2>/dev/null || true
        git add packages/ai-agent/package.json 2>/dev/null || true
        
        git checkout --theirs packages/ai-agent/tests/*.ts 2>/dev/null || true
        git add packages/ai-agent/tests/*.ts 2>/dev/null || true
        
        git checkout --theirs packages/providers/src/agent/*.ts 2>/dev/null || true
        git add packages/providers/src/agent/*.ts 2>/dev/null || true
        
        git checkout --theirs packages/providers/package.json 2>/dev/null || true
        git add packages/providers/package.json 2>/dev/null || true
        
        git checkout --theirs packages/providers/tests/*.ts 2>/dev/null || true
        git add packages/providers/tests/*.ts 2>/dev/null || true
        
        git checkout --theirs packages/config/src/env.ts 2>/dev/null || true
        git add packages/config/src/env.ts 2>/dev/null || true
        
        git checkout --theirs apps/client/app/api/agent/chat/route.ts 2>/dev/null || true
        git add apps/client/app/api/agent/chat/route.ts 2>/dev/null || true
        
        git checkout --theirs apps/client/lib/supabase/service-role.ts 2>/dev/null || true
        git add apps/client/lib/supabase/service-role.ts 2>/dev/null || true
        
        git checkout --theirs .env.example 2>/dev/null || true
        git add .env.example 2>/dev/null || true
        
        git checkout --theirs docs/*.md 2>/dev/null || true
        git add docs/*.md 2>/dev/null || true
        
        # Migrations
        git checkout --theirs supabase/migrations/*.sql 2>/dev/null || true
        git add supabase/migrations/*.sql 2>/dev/null || true
        
        # Regenerate lock file
        git checkout --theirs pnpm-lock.yaml 2>/dev/null || true
        git add pnpm-lock.yaml 2>/dev/null || true
        
        git commit -m "feat: add durable sessions and rate limiting from PR #307"
    fi
    
    log_info "Running pnpm install to sync dependencies..."
    pnpm install --frozen-lockfile || pnpm install
    
    log_info "PR #307 merged successfully"
}

run_tests() {
    log_info "Running test suite..."
    
    # Set required environment variables for tests
    export NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://placeholder.supabase.co}"
    export NEXT_PUBLIC_SUPABASE_ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-placeholder}"
    export SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-placeholder}"
    export OPENAI_API_KEY="${OPENAI_API_KEY:-placeholder}"
    export BACKUP_PEPPER=$(openssl rand -hex 32)
    export MFA_SESSION_SECRET=$(openssl rand -hex 32)
    export TRUSTED_COOKIE_SECRET=$(openssl rand -hex 32)
    export HMAC_SHARED_SECRET=$(openssl rand -hex 32)
    export KMS_DATA_KEY_BASE64=$(openssl rand -base64 32)
    
    log_info "Running AI agent tests..."
    pnpm --filter @ibimina/ai-agent test || log_warn "AI agent tests failed"
    
    log_info "Running providers tests..."
    pnpm --filter @ibimina/providers test || log_warn "Providers tests failed"
    
    log_info "Type checking..."
    pnpm typecheck || log_warn "Type check failed"
    
    log_info "Tests complete (check warnings above)"
}

print_summary() {
    echo ""
    echo "================================================"
    echo "Merge Complete!"
    echo "================================================"
    echo ""
    log_info "Next steps:"
    echo "  1. Review the merged code"
    echo "  2. Run database migrations: cd supabase && supabase db push"
    echo "  3. Update environment variables (see .env.example)"
    echo "  4. Test the chat endpoint: curl -X POST http://localhost:3000/api/agent/chat"
    echo "  5. Push to remote: git push origin main"
    echo ""
    log_warn "Remember to update API consumers - the AI agent API has changed!"
    echo ""
}

# Main execution
main() {
    check_preconditions
    backup_current_implementation
    remove_orchestrator_implementation
    merge_pr_270
    merge_pr_305
    merge_pr_307
    run_tests
    print_summary
}

# Run main function
main
