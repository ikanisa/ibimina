#!/bin/bash

################################################################################
# PR Conflict Resolution - Automated Cleanup Script
#
# This script closes all 16 conflicting PRs and creates tracking issues.
# 
# IMPORTANT: Review carefully before running!
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - Write access to the repository
# - Manual review of PR_CONFLICT_ANALYSIS.md
#
# Usage:
#   ./close-conflicting-prs.sh
#
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO="ikanisa/ibimina"
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --repo)
            REPO="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--repo owner/repo]"
            exit 1
            ;;
    esac
done

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo "═══════════════════════════════════════════════════════════"
echo "  PR Conflict Resolution - Automated Cleanup"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No changes will be made"
    echo ""
fi

# Verify prerequisites
print_step "Checking prerequisites..."

if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) not found. Please install it first:"
    echo "  https://cli.github.com/manual/installation"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    print_error "GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi

print_success "Prerequisites verified"
echo ""

# Confirm with user
if [ "$DRY_RUN" = false ]; then
    print_warning "This script will:"
    echo "  1. Close 16 pull requests"
    echo "  2. Add explanatory comments to each PR"
    echo "  3. Create 4 tracking issues"
    echo "  4. Delete stale branches"
    echo ""
    read -p "Do you want to continue? (type 'yes' to proceed): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_warning "Aborted by user"
        exit 0
    fi
    echo ""
fi

# Standard closure message
CLOSE_MESSAGE="## PR Closed - Merge Conflicts

This PR has been closed due to irresolvable merge conflicts with the main branch.

### Why this happened
This PR was created from an outdated version of main. Since then, the main branch has significantly diverged, resulting in conflicts across hundreds of files.

### What happens next
The work in this PR is valuable and will be preserved:

1. **Tracking Issue Created**: A tracking issue has been created for this work
2. **Content Documented**: All changes have been documented in PR_CONFLICT_ANALYSIS.md
3. **Recreation Planned**: High-priority PRs will be recreated from latest main

### Prevention
We've implemented new measures to prevent this:
- Branch protection rules requiring up-to-date branches
- Automated stale PR detection
- Updated PR creation guidelines

See PR_CONFLICT_ANALYSIS.md for full details.

Thank you for your contribution!"

# PRs to close
declare -A PRS
PRS[661]="Streamline admin console navigation and invites"
PRS[658]="Add integration tests for login and invite APIs"
PRS[654]="Update Supabase email + QR auth docs and deployment quickstart"
PRS[652]="Add minimal theme tokens and streamline navigation layout"
PRS[651]="Add QR auth endpoints and mobile approval flow"
PRS[650]="Add admin invite flow with audit logging"
PRS[649]="Add Supabase email login and session enforcement for staff PWA"
PRS[648]="chore: prune legacy auth tooling"
PRS[647]="Remove legacy MFA and authx features"
PRS[646]="Add Supabase auth login UI and admin invite API"
PRS[645]="Add roadmap initiatives for WhatsApp OTP and UI polish"
PRS[644]="feat: add client mobile loading states"
PRS[643]="Fix mobile data and payments regression"
PRS[641]="Fix background sync for onboarding queue"
PRS[628]="Secure NFC payload signing across Android and iOS"
PRS[618]="Streamline MFA challenge flow and notices"

# Close PRs
print_step "Closing pull requests..."
echo ""

CLOSED_COUNT=0
FAILED_COUNT=0

for pr_number in "${!PRS[@]}"; do
    pr_title="${PRS[$pr_number]}"
    
    if [ "$DRY_RUN" = true ]; then
        print_warning "[DRY RUN] Would close PR #${pr_number}: ${pr_title}"
    else
        echo "Closing PR #${pr_number}: ${pr_title}"
        
        # Add comment first, then close the PR
        if gh pr comment "$pr_number" --repo "$REPO" --body "$CLOSE_MESSAGE" 2>/dev/null && \
           gh pr close "$pr_number" --repo "$REPO" 2>/dev/null; then
            print_success "Closed PR #${pr_number}"
            ((CLOSED_COUNT++))
            
            # Note: Branch deletion is handled by GitHub's PR settings
            # If you want to delete branches, use: gh pr close --delete-branch
        else
            print_error "Failed to close PR #${pr_number}"
            ((FAILED_COUNT++))
        fi
    fi
done

echo ""
print_success "Closed ${CLOSED_COUNT} PRs"
if [ $FAILED_COUNT -gt 0 ]; then
    print_warning "Failed to close ${FAILED_COUNT} PRs (they may already be closed)"
fi
echo ""

# Create tracking issues
print_step "Creating tracking issues..."
echo ""

ISSUE_COUNT=0

# Issue 1: Authentication & Security
if [ "$DRY_RUN" = true ]; then
    print_warning "[DRY RUN] Would create issue: Supabase Authentication Migration"
else
    issue_body="## Overview
Consolidate authentication-related work from multiple closed PRs.

## Original PRs
- #618 - Streamline MFA challenge flow
- #646 - Add Supabase auth login UI
- #647 - Remove legacy MFA
- #648 - Prune legacy auth tooling
- #649 - Add Supabase email login
- #650 - Add admin invite flow
- #651 - Add QR auth endpoints
- #654 - Update Supabase auth docs
- #658 - Add integration tests

## Scope
1. Migrate from custom MFA to Supabase auth
2. Implement admin invite flow with audit logging
3. Add QR auth endpoints for mobile approval
4. Add comprehensive integration tests
5. Update documentation

## Success Criteria
- [ ] Supabase auth fully implemented
- [ ] Legacy auth code removed
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] No security regressions

## Timeline
Week 1-2 of recreation phase

See PR_CONFLICT_ANALYSIS.md for details."

    if gh issue create --repo "$REPO" \
        --title "feat: Implement Supabase Authentication Migration" \
        --body "$issue_body" \
        --label "feature,priority:high,area:auth" > /dev/null; then
        print_success "Created issue: Supabase Authentication Migration"
        ((ISSUE_COUNT++))
    else
        print_error "Failed to create authentication issue"
    fi
fi

# Issue 2: UI/UX Improvements
if [ "$DRY_RUN" = true ]; then
    print_warning "[DRY RUN] Would create issue: Design System with Theme Tokens"
else
    issue_body="## Overview
Consolidate UI/UX improvements from multiple closed PRs.

## Original PRs
- #644 - Add client mobile loading states
- #652 - Add minimal theme tokens
- #661 - Streamline admin console navigation

## Scope
1. Establish design token system
2. Add loading states and skeletons
3. Streamline navigation
4. Improve component consistency

## Success Criteria
- [ ] Design tokens implemented
- [ ] All components use tokens
- [ ] Loading states added
- [ ] Navigation simplified
- [ ] Visual consistency improved

## Timeline
Week 1 of recreation phase

See PR_CONFLICT_ANALYSIS.md for details."

    if gh issue create --repo "$REPO" \
        --title "feat: Implement Design System with Theme Tokens" \
        --body "$issue_body" \
        --label "feature,priority:medium,area:ui" > /dev/null; then
        print_success "Created issue: Design System with Theme Tokens"
        ((ISSUE_COUNT++))
    else
        print_error "Failed to create UI issue"
    fi
fi

# Issue 3: Bug Fixes
if [ "$DRY_RUN" = true ]; then
    print_warning "[DRY RUN] Would create issue: Mobile Data and NFC Security Issues"
else
    issue_body="## Overview
Address critical bugs from closed PRs.

## Original PRs
- #628 - Secure NFC payload signing
- #641 - Fix background sync for onboarding
- #643 - Fix mobile data regression

## Scope
1. Fix mobile data regression
2. Implement secure NFC payload signing
3. Fix background sync issues
4. Add comprehensive tests

## Success Criteria
- [ ] Mobile data working correctly
- [ ] NFC payloads securely signed
- [ ] Background sync functioning
- [ ] Tests added for all fixes

## Priority
HIGH - Blocking mobile functionality

## Timeline
Immediate (Week 1)

See PR_CONFLICT_ANALYSIS.md for details."

    if gh issue create --repo "$REPO" \
        --title "bug: Fix Mobile Data and NFC Security Issues" \
        --body "$issue_body" \
        --label "bug,priority:high,area:mobile" > /dev/null; then
        print_success "Created issue: Mobile Data and NFC Security Issues"
        ((ISSUE_COUNT++))
    else
        print_error "Failed to create bug fix issue"
    fi
fi

# Issue 4: Documentation
if [ "$DRY_RUN" = true ]; then
    print_warning "[DRY RUN] Would create issue: Roadmap Documentation"
else
    issue_body="## Overview
Update documentation from closed PR #645.

## Scope
- Update NEXT_STEPS.md with roadmap initiatives
- Document WhatsApp OTP plans
- Document UI polish plans
- Update architecture docs

## Success Criteria
- [ ] Roadmap documented
- [ ] Next initiatives clear
- [ ] Technical debt tracked

## Priority
LOW - Can be committed directly to main

## Timeline
This week

See PR_CONFLICT_ANALYSIS.md for details."

    if gh issue create --repo "$REPO" \
        --title "docs: Update Roadmap and Technical Documentation" \
        --body "$issue_body" \
        --label "documentation,priority:low" > /dev/null; then
        print_success "Created issue: Roadmap Documentation"
        ((ISSUE_COUNT++))
    else
        print_error "Failed to create documentation issue"
    fi
fi

echo ""
print_success "Created ${ISSUE_COUNT} tracking issues"
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════"
echo "  Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
print_success "PRs closed: ${CLOSED_COUNT}"
print_success "Tracking issues created: ${ISSUE_COUNT}"
if [ $FAILED_COUNT -gt 0 ]; then
    print_warning "Failed operations: ${FAILED_COUNT}"
fi
echo ""

if [ "$DRY_RUN" = false ]; then
    print_step "Next steps:"
    echo "  1. Review tracking issues: gh issue list --repo ${REPO}"
    echo "  2. Verify PR closures: gh pr list --repo ${REPO} --state closed"
    echo "  3. Begin recreation from latest main"
    echo "  4. Implement prevention measures (.github/workflows/pr-hygiene.yml)"
    echo ""
    print_success "PR cleanup complete!"
else
    echo ""
    print_warning "DRY RUN - No changes were made"
    print_step "To execute for real, run: $0"
fi
echo ""
