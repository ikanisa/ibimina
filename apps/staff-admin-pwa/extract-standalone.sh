#!/bin/bash

# Extract Staff Admin PWA to Standalone Directory
# This script copies the PWA to a standalone location for easy development

set -e

echo "🚀 Extracting Staff Admin PWA to standalone directory..."
echo ""

# Determine target directory
TARGET_DIR="${1:-../staff-admin-pwa-app}"

# Create target directory
echo "📁 Creating directory: $TARGET_DIR"
mkdir -p "$TARGET_DIR"

# Copy all files
echo "📋 Copying files..."
cp -r ./* "$TARGET_DIR/" 2>/dev/null || true
cp -r ./.* "$TARGET_DIR/" 2>/dev/null || true

# Remove monorepo-specific files
echo "🧹 Cleaning up monorepo-specific files..."
rm -rf "$TARGET_DIR/node_modules" 2>/dev/null || true
rm -f "$TARGET_DIR/pnpm-lock.yaml" 2>/dev/null || true

cd "$TARGET_DIR"

# Remove prepare script that causes issues
echo "⚙️  Updating package.json..."
if command -v node &> /dev/null; then
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    delete pkg.scripts.prepare;
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
fi

echo ""
echo "✅ Done! Staff Admin PWA extracted to: $TARGET_DIR"
echo ""
echo "📦 Next steps:"
echo ""
echo "  cd $TARGET_DIR"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Then open http://localhost:3000"
echo "Login: admin@example.com / password"
echo ""
