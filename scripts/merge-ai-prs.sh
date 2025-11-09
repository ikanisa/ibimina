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

replay_pr() {
    local pr_number="$1"
    local remote_branch="$2"
    local merge_message="$3"
    local temp_branch="tmp/merge-pr-${pr_number}"

    log_info "Preparing PR #${pr_number} (${remote_branch}) for merge..."

    git fetch origin "${remote_branch}"

    if git rev-parse --verify "${temp_branch}" >/dev/null 2>&1; then
        git branch -D "${temp_branch}" >/dev/null 2>&1 || true
    fi

    git checkout -b "${temp_branch}" "origin/${remote_branch}"

    log_info "Rebasing PR #${pr_number} onto current main to preserve earlier merges..."

    set +e
    git rebase main
    local rebase_status=$?
    set -e

    if [ ${rebase_status} -ne 0 ]; then
        log_error "Automatic rebase for PR #${pr_number} failed. Resolve conflicts manually on branch ${temp_branch}."
        git rebase --abort >/dev/null 2>&1 || true
        git checkout main >/dev/null 2>&1 || true
        exit 1
    fi

    git checkout main

    log_info "Merging rebased PR #${pr_number}..."

    if ! git merge --no-ff "${temp_branch}" -m "${merge_message}"; then
        log_error "Merge of PR #${pr_number} failed after successful rebase. Resolve conflicts and retry."
        git checkout main >/dev/null 2>&1 || true
        exit 1
    fi

    git branch -D "${temp_branch}" >/dev/null 2>&1 || true

    log_info "PR #${pr_number} merged successfully"
}

merge_pr_270() {
    replay_pr "270" "codex/integrate-sentry-with-pii-scrubbing" "feat: integrate Sentry observability and PostHog from PR #270"

    log_info "Running pnpm install to sync dependencies..."
    pnpm install --frozen-lockfile || pnpm install
}

merge_pr_305() {
    replay_pr "305" "codex/define-schema-for-embeddings-in-supabase" "feat: add AI embedding pipeline and vector schema from PR #305"

    log_info "Running pnpm install to sync dependencies..."
    pnpm install --frozen-lockfile || pnpm install
}

merge_pr_307() {
    replay_pr "307" "codex/integrate-redis-for-session-storage" "feat: add durable sessions and rate limiting from PR #307"

    log_info "Running pnpm install to sync dependencies..."
    pnpm install --frozen-lockfile || pnpm install
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
    echo "  4. Test the chat endpoint: curl -X POST http://localhost:3100/api/agent/chat"
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
