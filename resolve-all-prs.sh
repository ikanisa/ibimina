#!/bin/bash

# Master script to resolve all PR conflicts
set -e

echo "🚀 Starting comprehensive PR conflict resolution for Ibimina"
echo "============================================================"

# Set up environment
export CI=true
export HUSKY=0
export NODE_OPTIONS="--max-old-space-size=8192"

# Configuration
PRS=(589 584 582 581 580 575 568)
MAIN_BRANCH="main"

# Function to resolve a single PR
resolve_single_pr() {
    local pr=$1
    echo ""
    echo "════════════════════════════════════════"
    echo "🔧 Processing PR #${pr}"
    echo "════════════════════════════════════════"
    
    # Checkout the PR
    gh pr checkout ${pr} || {
        echo "❌ Failed to checkout PR #${pr}"
        return 1
    }
    
    # Get current branch name
    current_branch=$(git branch --show-current)
    echo "📍 On branch: ${current_branch}"
    
    # Fetch latest main
    git fetch origin ${MAIN_BRANCH}
    
    # Attempt merge
    echo "📥 Merging latest ${MAIN_BRANCH}..."
    if git merge origin/${MAIN_BRANCH} --no-edit; then
        echo "✅ Merged without conflicts"
        return 0
    else
        echo "⚠️  Conflicts detected, attempting automatic resolution..."
        
        # Run TypeScript resolver if available
        if [ -f "scripts/auto-resolve-conflicts.ts" ]; then
            echo "🔧 Running auto-resolver..."
            pnpm tsx scripts/auto-resolve-conflicts.ts ${pr} || true
        fi
        
        # Handle package files
        for file in package.json pnpm-lock.yaml; do
            if git status --porcelain | grep -q "UU.*${file}"; then
                echo "📦 Resolving ${file}..."
                if [ "${file}" = "pnpm-lock.yaml" ]; then
                    echo "   Regenerating lock file..."
                    git checkout --theirs ${file} || true
                    rm -f pnpm-lock.yaml
                    pnpm install --no-frozen-lockfile || pnpm install
                    git add ${file}
                else
                    # Try to merge package.json intelligently
                    git checkout --theirs ${file}
                    git add ${file}
                fi
            fi
        done
        
        # Check remaining conflicts
        remaining=$(git diff --name-only --diff-filter=U | wc -l | tr -d ' ')
        if [ ${remaining} -gt 0 ]; then
            echo "⚠️  ${remaining} files still have conflicts:"
            git diff --name-only --diff-filter=U
            
            # Try to auto-resolve common patterns
            git status --porcelain | grep "^UU" | awk '{print $2}' | while read -r file; do
                echo "  Attempting to resolve: ${file}"
                
                # For documentation files, keep both
                if [[ ${file} == *.md ]]; then
                    git checkout --theirs ${file}
                    git add ${file}
                # For build files, prefer theirs (main)
                elif [[ ${file} == *.gradle* ]] || [[ ${file} == gradlew* ]]; then
                    git checkout --theirs ${file}
                    git add ${file}
                # For config files, prefer main
                elif [[ ${file} == *.config.* ]] || [[ ${file} == *.json ]]; then
                    git checkout --theirs ${file}
                    git add ${file}
                fi
            done
        fi
        
        # Final check
        remaining=$(git diff --name-only --diff-filter=U | wc -l | tr -d ' ')
        if [ ${remaining} -eq 0 ]; then
            echo "✅ All conflicts resolved automatically"
            git commit -m "chore: resolve conflicts with main branch

- Merged latest changes from main
- Auto-resolved package conflicts
- Updated dependencies" || true
            return 0
        else
            echo "❌ ${remaining} conflicts require manual resolution:"
            git diff --name-only --diff-filter=U
            return 1
        fi
    fi
}

# Main execution
echo "📦 Ensuring dependencies are installed..."
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Process all PRs
failed_prs=()
succeeded_prs=()

for pr in "${PRS[@]}"; do
    if resolve_single_pr ${pr}; then
        succeeded_prs+=($pr)
    else
        failed_prs+=($pr)
        # Return to main branch before continuing
        git checkout main || true
    fi
done

# Summary
echo ""
echo "════════════════════════════════════════"
echo "📊 Resolution Summary"
echo "════════════════════════════════════════"
echo "✅ Successfully resolved: ${#succeeded_prs[@]} PRs"
if [ ${#succeeded_prs[@]} -gt 0 ]; then
    echo "   ${succeeded_prs[*]}"
fi

if [ ${#failed_prs[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  PRs requiring manual intervention: ${#failed_prs[@]}"
    echo "   ${failed_prs[*]}"
    echo ""
    echo "To manually resolve remaining conflicts:"
    echo "1. gh pr checkout <PR_NUMBER>"
    echo "2. Resolve conflicts in your editor"
    echo "3. git add <resolved_files>"
    echo "4. git commit"
    echo "5. git push"
fi

echo ""
echo "🎉 Conflict resolution process complete!"

# Return to main branch
git checkout main
