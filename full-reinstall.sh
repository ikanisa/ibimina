#!/bin/bash
set -e

echo "=== FULL DEPENDENCY REINSTALL ==="

echo "Step 1: Cleaning all node_modules..."
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/*/node_modules apps/*/*/node_modules
rm -rf packages/*/node_modules

echo "Step 2: Cleaning build outputs..."
rm -rf apps/*/.next
rm -rf packages/*/dist

echo "Step 3: Installing dependencies (this may take 3-5 minutes)..."
pnpm install --no-frozen-lockfile

echo "✅ Full reinstall complete"
