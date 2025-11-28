#!/usr/bin/env bash
# 🚀 Complete AI Features Deployment Script
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🤖 AI Features Complete Deployment                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo

echo -e "${YELLOW}📋 This script will:${NC}"
echo "  1. Install dependencies (framer-motion, recharts, lucide-react)"
echo "  2. Configure environment variables"
echo "  3. Update Tauri permissions"
echo "  4. Create database tables"
echo "  5. Deploy Gemini proxy Edge Function"
echo "  6. Build the desktop app"
echo ""
echo -e "${YELLOW}Estimated time: 10-15 minutes${NC}"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo -e "${GREEN}Starting deployment...${NC}\n"

# Run from the deployment script in AI_FEATURES_DEPLOY.md
echo -e "${BLUE}📖 See AI_FEATURES_DEPLOY.md for detailed instructions${NC}"
echo -e "${BLUE}📖 See AI_FEATURES_QUICKSTART_DEPLOY.md for quick reference${NC}\n"

echo -e "${GREEN}✅ Ready! Follow the deployment guide.${NC}"
