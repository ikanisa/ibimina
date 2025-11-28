# AI Features Deployment Guide

**Branch:** `feature/ai-features`  
**Status:** Ready to Deploy  
**Target:** Local Development → Staging → Production

---

## Prerequisites

### Required Tools
- ✅ Docker Desktop (running)
- ✅ Supabase CLI (`npm install -g supabase`)
- ✅ pnpm 10.19.0+
- ✅ Node.js 20+

### Required Credentials
- 🔑 **Gemini API Key** - Get from https://ai.google.dev/
- 🔑 **Supabase Project** - For staging/production

---

## Quick Deploy (Automated)

The easiest way to deploy:

```bash
# 1. Get your Gemini API key
# Visit: https://ai.google.dev/
# Create a project and enable the Gemini API

# 2. Export the key
export GEMINI_API_KEY=your_gemini_api_key_here

# 3. Run deployment script
./scripts/deploy-ai-features.sh
```

The script will:
1. ✅ Check Docker is running
2. ✅ Start Supabase locally
3. ✅ Apply database migrations
4. ✅ Set secrets
5. ✅ Deploy Edge Function
6. ✅ Verify deployment

---

## Manual Deploy (Step by Step)

### Step 1: Get Gemini API Key

1. Go to https://ai.google.dev/
2. Click "Get API Key"
3. Create a new project or select existing
4. Enable "Gemini API"
5. Generate API key
6. Copy the key

### Step 2: Start Docker

**macOS:**
```bash
open -a Docker
```

**Linux:**
```bash
sudo systemctl start docker
```

**Verify:**
```bash
docker info
# Should show Docker version and status
```

### Step 3: Start Supabase

```bash
# Start local Supabase (takes ~2 minutes first time)
supabase start

# Expected output:
# Started supabase local development setup.
#
# API URL: http://localhost:54321
# GraphQL URL: http://localhost:54321/graphql/v1
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# ...
```

**Save these URLs!** You'll need them for configuration.

### Step 4: Apply Database Migrations

```bash
# Apply all migrations including AI features
supabase db push

# This will:
# - Create 6 new tables
# - Set up RLS policies
# - Create helper functions
# - Enable realtime
```

**Verify:**
```bash
# Connect to database
supabase db diff

# Should show no pending migrations
```

### Step 5: Set Secrets

```bash
# Set Gemini API key
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

# Verify
supabase secrets list
# Should show: GEMINI_API_KEY (set)
```

### Step 6: Deploy Edge Function

```bash
# Deploy the gemini-proxy function
supabase functions deploy gemini-proxy --no-verify-jwt

# Expected output:
# Deploying Function gemini-proxy...
# Deployed Function gemini-proxy to [your-project]
# URL: http://localhost:54321/functions/v1/gemini-proxy
```

**Test the function:**
```bash
# Serve locally for testing
supabase functions serve gemini-proxy

# In another terminal, test it:
curl -X POST http://localhost:54321/functions/v1/gemini-proxy \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "Say hello in JSON format"}]
    }],
    "generationConfig": {
      "temperature": 0.1,
      "responseMimeType": "application/json"
    }
  }'
```

### Step 7: Configure Desktop App

Create `.env.local` in `apps/desktop/staff-admin/`:

```bash
# Supabase (from Step 3)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_anon_key_from_supabase_start

# Feature Flags (default: off, enable as needed)
VITE_FEATURE_DOCUMENT_SCANNING=false
VITE_FEATURE_FRAUD_DETECTION=false
VITE_FEATURE_VOICE_COMMANDS=false
VITE_FEATURE_ACCESSIBILITY_ENHANCED=true
VITE_FEATURE_REALTIME_ANALYTICS=false
```

### Step 8: Install Dependencies

```bash
# Install all dependencies
pnpm install

# Specifically for desktop app
pnpm --filter @ibimina/staff-admin-desktop install
```

### Step 9: Start Development

```bash
# Start desktop app
pnpm --filter @ibimina/staff-admin-desktop dev

# Or use Tauri
pnpm --filter @ibimina/staff-admin-desktop tauri dev
```

---

## Verification Checklist

After deployment, verify everything works:

### Database Tables
```sql
-- Connect to DB
psql postgresql://postgres:postgres@localhost:54322/postgres

-- Check tables exist
\dt public.api_rate_limits
\dt public.fraud_alerts
\dt public.member_fraud_profiles
\dt public.document_scans
\dt public.voice_command_history
\dt public.user_accessibility_settings

-- All should return "public | table_name | table"
```

### RLS Policies
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'api_rate_limits',
  'fraud_alerts',
  'member_fraud_profiles',
  'document_scans',
  'voice_command_history',
  'user_accessibility_settings'
);

-- All should show rowsecurity = true
```

### Edge Function
```bash
# Check function is deployed
supabase functions list

# Should show: gemini-proxy (deployed)

# View logs
supabase functions logs gemini-proxy --follow
```

### Client Code
```bash
# Type check
pnpm --filter @ibimina/staff-admin-desktop typecheck

# Should pass without errors related to AI features
```

---

## Deployment to Staging/Production

### Staging Deployment

1. **Create Supabase project:**
   ```bash
   # Link to your staging project
   supabase link --project-ref your-staging-ref
   ```

2. **Push migrations:**
   ```bash
   supabase db push --db-url your-staging-db-url
   ```

3. **Set secrets:**
   ```bash
   supabase secrets set --project-ref your-staging-ref \
     GEMINI_API_KEY=your_key
   ```

4. **Deploy function:**
   ```bash
   supabase functions deploy gemini-proxy \
     --project-ref your-staging-ref \
     --no-verify-jwt
   ```

5. **Update app config:**
   ```bash
   # In apps/desktop/staff-admin/.env.production
   VITE_SUPABASE_URL=https://your-staging-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-staging-anon-key
   ```

### Production Deployment

Same as staging, but:
- Use production Supabase project
- Enable all security features
- Set proper CORS origins
- Enable monitoring
- Set up billing alerts

**Additional production steps:**

1. **Enable rate limiting alerts:**
   ```sql
   -- Create alert for rate limit breaches
   CREATE OR REPLACE FUNCTION notify_rate_limit_breach()
   RETURNS TRIGGER AS $$
   BEGIN
     IF NEW.request_count > 90 THEN
       -- Send notification
       PERFORM pg_notify('rate_limit_warning', 
         json_build_object(
           'user_id', NEW.user_id,
           'count', NEW.request_count
         )::text
       );
     END IF;
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER rate_limit_monitor
     AFTER INSERT OR UPDATE ON api_rate_limits
     FOR EACH ROW
     EXECUTE FUNCTION notify_rate_limit_breach();
   ```

2. **Set up monitoring:**
   - Enable Supabase logging
   - Set up Sentry for Edge Function errors
   - Configure PostHog for usage analytics

3. **Security hardening:**
   ```typescript
   // Update cors Headers in gemini-proxy/index.ts
   const corsHeaders = {
     'Access-Control-Allow-Origin': 'https://your-domain.com',
     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
   };
   ```

---

## Troubleshooting

### "Docker daemon not running"
**Solution:**
```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Verify
docker ps
```

### "GEMINI_API_KEY not configured"
**Solution:**
```bash
# Check if set
supabase secrets list

# If not, set it
supabase secrets set GEMINI_API_KEY=your_key

# Redeploy function
supabase functions deploy gemini-proxy --no-verify-jwt
```

### "Migration already applied"
**Solution:**
```bash
# Reset local database
supabase db reset

# This will:
# - Drop all tables
# - Reapply all migrations
# - Reseed data
```

### "Edge Function 500 error"
**Solution:**
```bash
# View logs
supabase functions logs gemini-proxy

# Common issues:
# 1. GEMINI_API_KEY not set → supabase secrets set
# 2. Invalid API key → Check at ai.google.dev
# 3. Rate limit exceeded → Wait or increase quota
```

### "TypeScript errors in ai-config.ts"
**Solution:**
```bash
# Ensure vite-env.d.ts exists
ls apps/desktop/staff-admin/src/vite-env.d.ts

# If not, it should have been created in the last commit
git status

# Reinstall dependencies
pnpm install
```

---

## Rollback Procedure

If something goes wrong:

### Rollback Database
```bash
# Find the migration before AI features
cd supabase/migrations
ls -1 | grep -B 1 "20260120000000"

# Rollback to that migration
supabase db reset --version <previous_migration>
```

### Rollback Edge Function
```bash
# Delete the function
supabase functions delete gemini-proxy

# Or deploy previous version if exists
git checkout main
supabase functions deploy gemini-proxy
```

### Rollback Client Code
```bash
# Switch to main branch
git checkout main

# Rebuild
pnpm install
pnpm --filter @ibimina/staff-admin-desktop build
```

---

## Monitoring & Maintenance

### Daily Checks
```sql
-- Check API usage
SELECT 
  DATE(window_start) as date,
  COUNT(DISTINCT user_id) as users,
  SUM(request_count) as total_requests,
  MAX(request_count) as max_per_user
FROM api_rate_limits
WHERE window_start > NOW() - INTERVAL '7 days'
GROUP BY DATE(window_start)
ORDER BY date DESC;
```

### Weekly Checks
```sql
-- Check fraud alert trends
SELECT 
  DATE_TRUNC('week', created_at) as week,
  severity,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM fraud_alerts
WHERE created_at > NOW() - INTERVAL '4 weeks'
GROUP BY week, severity
ORDER BY week DESC, severity;
```

### Monthly Checks
- Review Gemini API costs
- Check rate limit effectiveness
- Analyze fraud detection accuracy
- Review accessibility adoption

---

## Cost Management

### Gemini API Cost Tracking
```bash
# Export usage data
supabase db dump --data-only \
  --table api_rate_limits \
  --file usage_$(date +%Y%m).csv

# Analyze in spreadsheet
```

### Setting Budget Alerts
1. Go to Google Cloud Console
2. Navigate to Billing
3. Create budget for Gemini API
4. Set alert at 50%, 90%, 100%

### Reducing Costs
- Enable caching for repeated queries
- Increase rate limit thresholds
- Use smaller Gemini models for simple tasks
- Batch process documents

---

## Next Steps

After successful deployment:

1. **Test all features:**
   - Document scanning
   - Fraud detection
   - Voice commands
   - Accessibility
   - Real-time analytics

2. **Enable features gradually:**
   ```bash
   # Start with one feature
   VITE_FEATURE_ACCESSIBILITY_ENHANCED=true

   # Add more after testing
   VITE_FEATURE_DOCUMENT_SCANNING=true
   ```

3. **Monitor performance:**
   - Check Edge Function latency
   - Monitor database query times
   - Track API usage and costs

4. **Proceed to Phase 2:**
   - Implement core AI services
   - Build UI components
   - Write tests

---

## Support

**Documentation:**
- [Implementation Plan](./AI_FEATURES_IMPLEMENTATION_PLAN.md)
- [Quick Start Guide](./AI_FEATURES_QUICKSTART.md)
- [Phase 1 Summary](./AI_PHASE_1_COMPLETE.md)

**Get Help:**
- Supabase Discord: https://discord.supabase.com/
- Gemini API Docs: https://ai.google.dev/docs
- GitHub Issues: [Create an issue]

---

**Last Updated:** 2024-11-28  
**Version:** 1.0  
**Maintainer:** Ibimina Development Team
