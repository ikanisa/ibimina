#!/bin/bash
# Update all website pages to use Atlas UI design system

echo "🎨 Updating SACCO+ Website to Atlas UI..."
echo ""

# Pages that still use "glass" styling that need to be updated
PAGES=(
  "apps/website/app/saccos/page.tsx"
  "apps/website/app/faq/page.tsx" 
  "apps/website/app/pilot-nyamagabe/page.tsx"
  "apps/website/app/about/page.tsx"
  "apps/website/app/features/page.tsx"
  "apps/website/app/contact/page.tsx"
  "apps/website/app/members/page.tsx"
)

echo "📝 Pages to update:"
for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    count=$(grep -c "glass" "$page" 2>/dev/null || echo "0")
    if [ "$count" -gt "0" ]; then
      echo "   ✗ $page ($count glass references)"
    else
      echo "   ✓ $page (already clean)"
    fi
  else
    echo "   ? $page (not found)"
  fi
done

echo ""
echo "🔧 Running replacements..."
echo ""

# Function to replace glass styling with Atlas UI
replace_styling() {
  local file=$1
  
  if [ ! -f "$file" ]; then
    echo "   ⚠️  Skipping $file (not found)"
    return
  fi
  
  # Replace glass with border-based cards
  sed -i.bak 's/className="glass/className="bg-white border border-neutral-200 rounded-xl/g' "$file"
  sed -i.bak 's/className="glass /className="bg-white border border-neutral-200 rounded-xl /g' "$file"
  
  # Replace color references
  sed -i.bak 's/text-rwyellow/text-brand-yellow/g' "$file"
  sed -i.bak 's/text-rwblue/text-brand-blue/g' "$file"
  sed -i.bak 's/text-rwgreen/text-brand-green/g' "$file"
  sed -i.bak 's/text-ink/text-neutral-900/g' "$file"
  sed -i.bak 's/bg-rwyellow/bg-brand-yellow/g' "$file"
  sed -i.bak 's/bg-rwblue/bg-brand-blue/g' "$file"
  sed -i.bak 's/bg-rwgreen/bg-brand-green/g' "$file"
  sed -i.bak 's/bg-ink/bg-neutral-900/g' "$file"
  
  # Replace opacity with text-neutral-600
  sed -i.bak 's/opacity-90/text-neutral-600/g' "$file"
  
  # Remove backup file
  rm -f "${file}.bak"
  
  echo "   ✓ Updated $file"
}

# Update all pages
for page in "${PAGES[@]}"; do
  replace_styling "$page"
done

echo ""
echo "✅ Atlas UI update complete!"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test locally: cd apps/website && pnpm dev"
echo "3. Commit: git add . && git commit -m 'feat(website): complete Atlas UI redesign'"

