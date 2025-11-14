#!/bin/bash
# Cleanup old documentation and status files

echo "=== Cleaning up old documentation ==="

# Create archive directory
mkdir -p archive/old-docs-2025-11-14

# Move old status/summary files
mv *SUMMARY*.md archive/old-docs-2025-11-14/ 2>/dev/null
mv *STATUS*.md archive/old-docs-2025-11-14/ 2>/dev/null  
mv *COMPLETE*.md archive/old-docs-2025-11-14/ 2>/dev/null
mv *IMPLEMENTATION*.md archive/old-docs-2025-11-14/ 2>/dev/null
mv *DELIVERY*.md archive/old-docs-2025-11-14/ 2>/dev/null
mv *PR*.md archive/old-docs-2025-11-14/ 2>/dev/null
mv *FIX*.md archive/old-docs-2025-11-14/ 2>/dev/null
mv *PLAN*.md archive/old-docs-2025-11-14/ 2>/dev/null

# Keep essential docs
git checkout README.md CONTRIBUTING.md ARCHITECTURE.md SECURITY.md 2>/dev/null

echo "✅ Archived old documentation to archive/old-docs-2025-11-14/"
ls -lh archive/old-docs-2025-11-14/ | wc -l
