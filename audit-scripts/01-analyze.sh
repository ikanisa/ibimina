#!/bin/bash
echo "=== COMPREHENSIVE CODEBASE ANALYSIS ==="
echo ""
echo "## 1. Repository Overview"
echo "Root packages:"
find . -maxdepth 1 -name "package.json" -exec echo "  - Root" \;
echo ""
echo "App packages:"
find apps -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null | sed 's|./||'
echo ""
echo "Shared packages:"
find packages -maxdepth 2 -name "package.json" -not -path "*/node_modules/*" 2>/dev/null | sed 's|./||'

echo ""
echo "## 2. Workspace Configuration"
cat pnpm-workspace.yaml

echo ""
echo "## 3. Key Files Count"
echo "TypeScript files: $(find apps packages -name '*.ts' -o -name '*.tsx' | grep -v node_modules | wc -l | tr -d ' ')"
echo "CSS files: $(find apps packages -name '*.css' | grep -v node_modules | wc -l | tr -d ' ')"
echo "Config files: $(find . -maxdepth 2 -name '*.config.*' | wc -l | tr -d ' ')"

echo ""
echo "## 4. Build Outputs"
find . -name ".next" -o -name "dist" -o -name "build" | grep -v node_modules | head -10
