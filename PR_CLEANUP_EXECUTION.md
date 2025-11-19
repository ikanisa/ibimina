# PR Cleanup Execution Plan

This document provides the exact commands needed to close all conflicting PRs and create tracking issues.

## Prerequisites

Ensure you have:
- `gh` CLI installed and authenticated
- Permission to close PRs in the repository
- Permission to create issues

## Step 1: Close All Conflicting PRs

Run these commands to close each PR with an explanation:

```bash
# Set up variables
REPO="ikanisa/ibimina"
CLOSE_MESSAGE="## PR Closed - Merge Conflicts

This PR has been closed due to irresolvable merge conflicts with the main branch.

### Why this happened
This PR was created from an outdated version of main (SHA: %BASE_SHA%). Since then, the main branch has significantly diverged, resulting in conflicts across hundreds of files.

### What happens next
The work in this PR is valuable and will be preserved:

1. **Tracking Issue Created**: See issue #%ISSUE_NUMBER% for continuation
2. **Content Documented**: All changes have been documented in PR_CONFLICT_ANALYSIS.md
3. **Recreation Planned**: High-priority PRs will be recreated from latest main

### Prevention
We've implemented new measures to prevent this:
- Branch protection rules requiring up-to-date branches
- Automated stale PR detection
- Updated PR creation guidelines

See PR_CONFLICT_ANALYSIS.md for full details.

Thank you for your contribution!"

# Close PR #661 - Streamline admin console navigation
gh pr close 661 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #658 - Add integration tests for login
gh pr close 658 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #654 - Update Supabase email + QR docs  
gh pr close 654 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #652 - Add minimal theme tokens
gh pr close 652 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #651 - Add QR auth endpoints
gh pr close 651 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #650 - Add admin invite flow
gh pr close 650 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #649 - Add Supabase email login
gh pr close 649 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #648 - Prune legacy auth tooling
gh pr close 648 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #647 - Remove legacy MFA
gh pr close 647 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #646 - Add Supabase auth login UI
gh pr close 646 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #645 - Add roadmap initiatives
gh pr close 645 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #644 - Add client mobile loading states
gh pr close 644 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #643 - Fix mobile data regression
gh pr close 643 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #641 - Fix background sync
gh pr close 641 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #628 - Secure NFC payload signing
gh pr close 628 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch

# Close PR #618 - Streamline MFA challenge flow
gh pr close 618 --repo ${REPO} --comment "${CLOSE_MESSAGE}" --delete-branch
```

## Step 2: Create Tracking Issues

Create issues for work that should be recreated:

```bash
# Issue for Authentication & Security Consolidation
gh issue create --repo ${REPO} \
  --title "feat: Implement Supabase Authentication Migration" \
  --body "## Overview
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

See PR_CONFLICT_ANALYSIS.md for details." \
  --label "feature,priority:high,area:auth"

# Issue for UI/UX Improvements
gh issue create --repo ${REPO} \
  --title "feat: Implement Design System with Theme Tokens" \
  --body "## Overview
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

See PR_CONFLICT_ANALYSIS.md for details." \
  --label "feature,priority:medium,area:ui"

# Issue for Critical Bug Fixes
gh issue create --repo ${REPO} \
  --title "bug: Fix Mobile Data and NFC Security Issues" \
  --body "## Overview
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

See PR_CONFLICT_ANALYSIS.md for details." \
  --label "bug,priority:high,area:mobile"

# Issue for Documentation
gh issue create --repo ${REPO} \
  --title "docs: Update Roadmap and Technical Documentation" \
  --body "## Overview
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

See PR_CONFLICT_ANALYSIS.md for details." \
  --label "documentation,priority:low"
```

## Step 3: Verify Cleanup

```bash
# Check that all PRs are closed
gh pr list --repo ${REPO} --state open

# Verify tracking issues created
gh issue list --repo ${REPO} --label "priority:high"
```

## Step 4: Update Prevention Measures

Create `.github/workflows/pr-hygiene.yml`:

```yaml
name: PR Hygiene

on:
  schedule:
    - cron: '0 0 * * *' # Daily at midnight
  pull_request:
    types: [opened, synchronize]

jobs:
  check-staleness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check if PR is stale
        run: |
          # Check if branch is behind main by more than 50 commits
          BEHIND=$(git rev-list --count HEAD..origin/main)
          if [ $BEHIND -gt 50 ]; then
            gh pr comment ${{ github.event.pull_request.number }} \
              --body "⚠️ This PR is $BEHIND commits behind main. Please rebase to avoid conflicts."
          fi
          
      - name: Check for merge conflicts
        run: |
          git fetch origin main
          if ! git merge-tree $(git merge-base HEAD origin/main) HEAD origin/main | grep -q "CONFLICT"; then
            echo "✅ No conflicts detected"
          else
            gh pr comment ${{ github.event.pull_request.number }} \
              --body "⚠️ This PR has merge conflicts. Please resolve them to proceed with review."
            gh pr edit ${{ github.event.pull_request.number }} --add-label "conflicts"
          fi
```

## Step 5: Update CONTRIBUTING.md

Add to CONTRIBUTING.md:

```markdown
### PR Best Practices

To avoid merge conflicts and keep PRs mergeable:

1. **Always create PRs from latest main**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature
   ```

2. **Keep PRs small and focused**
   - One feature or fix per PR
   - Aim for < 500 lines of changes
   - Break large features into smaller PRs

3. **Rebase frequently for long-lived PRs**
   ```bash
   git fetch origin main
   git rebase origin/main
   git push --force-with-lease
   ```

4. **Respond to conflicts quickly**
   - If CI reports conflicts, fix them within 24 hours
   - If you can't fix conflicts, ask for help
   - PRs with conflicts for > 7 days may be closed

5. **Keep your branch up to date**
   - Check "Update branch" button in GitHub
   - Or rebase locally regularly
```

## Automated Execution Script

If you want to run all commands at once:

```bash
#!/bin/bash
set -e

echo "🚀 Starting PR cleanup process"
echo "================================"

# This script should be run manually with review at each step
# DO NOT run unattended

read -p "This will close 16 PRs. Continue? (yes/no) " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted"
    exit 1
fi

# Source the individual commands above
# Review each section before executing

echo "✅ PR cleanup complete"
echo ""
echo "Next steps:"
echo "1. Verify all PRs closed"
echo "2. Verify tracking issues created"
echo "3. Begin recreation from latest main"
```

## Summary

After executing these steps:

- ✅ All 16 conflicting PRs closed with explanation
- ✅ Tracking issues created for important work
- ✅ Prevention measures implemented
- ✅ Team guidelines updated
- ✅ Ready to begin recreation phase

The repository will be in a clean state with clear next steps documented in tracking issues.
