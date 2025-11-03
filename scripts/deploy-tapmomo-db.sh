#!/usr/bin/env bash

# TapMoMo Database Deployment Script
# Applies TapMoMo schema directly to the database

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Deploying TapMoMo Database Schema..."
echo ""

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo "❌ Error: .env file not found"
    exit 1
fi

# Check required variables
if [ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in .env"
    exit 1
fi

if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not set in .env"
    exit 1
fi

# Extract project reference from URL
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
echo "📊 Project: $PROJECT_REF"
echo ""

# Execute SQL script using Supabase REST API
echo "📝 Applying TapMoMo schema..."

SQL_FILE="$SCRIPT_DIR/deploy-tapmomo-db.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL file not found at $SQL_FILE"
    exit 1
fi

# Read SQL file
SQL_CONTENT=$(cat "$SQL_FILE")

# Use psql if available (more reliable)
if command -v psql &> /dev/null; then
    echo "Using psql to deploy..."
    
    # Build connection string
    DB_URL="${NEXT_PUBLIC_SUPABASE_URL/https:\/\//}"
    DB_HOST="db.${DB_URL}"
    
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
        -h "$DB_HOST" \
        -p 5432 \
        -U postgres \
        -d postgres \
        -f "$SQL_FILE" \
        2>&1 | tee /tmp/tapmomo-deploy.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo ""
        echo "✅ TapMoMo database schema deployed successfully!"
    else
        echo ""
        echo "❌ Deployment failed. Check /tmp/tapmomo-deploy.log for details."
        exit 1
    fi
else
    echo "⚠️  psql not found. Please install PostgreSQL client or use Supabase Dashboard SQL Editor."
    echo ""
    echo "Manual deployment steps:"
    echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
    echo "2. Copy the contents of: $SQL_FILE"
    echo "3. Paste and run the SQL"
    exit 1
fi

echo ""
echo "📋 Next steps:"
echo "1. Verify tables in dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "2. Check Edge Function: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "3. Configure test merchant account"
echo ""
