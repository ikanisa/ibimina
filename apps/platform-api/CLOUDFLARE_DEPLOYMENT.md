# Platform API Workers Deployment Guide

The `platform-api` app contains background workers that need to run
continuously:

- **MoMo Poller**: Polls mobile money API for transaction updates
- **GSM Heartbeat**: Monitors and maintains GSM modem connections

These workers cannot be deployed to Cloudflare Pages (which is for web apps).
Instead, they should be deployed as **Cloudflare Workers with Durable Objects**
or on a traditional server/container platform.

## Deployment Options

### Option 1: Cloudflare Workers (Recommended for Consistency)

Transform the workers to use Cloudflare's Cron Triggers:

1. **Create Cloudflare Workers** for each background job
2. **Use Cron Triggers** to schedule regular execution
3. **Use Durable Objects** for maintaining state

#### Migration Steps

1. Convert workers to Cloudflare Worker format:

   ```typescript
   // apps/platform-api/workers/momo-poller.worker.ts
   export default {
     async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
       // Polling logic here
     },
   };
   ```

2. Create `wrangler.toml` for each worker:

   ```toml
   name = "ibimina-momo-poller"
   compatibility_date = "2024-10-01"

   [triggers]
   crons = ["*/5 * * * *"] # Every 5 minutes

   [vars]
   SUPABASE_URL = "https://your-project.supabase.co"
   ```

3. Deploy:
   ```bash
   wrangler deploy apps/platform-api/workers/momo-poller.worker.ts
   ```

### Option 2: Container Deployment (Current Setup)

Deploy as Docker containers to any container platform:

- **Fly.io** (recommended for global edge)
- **Railway**
- **Render**
- **Google Cloud Run**
- **AWS ECS/Fargate**
- **Azure Container Apps**

#### Docker Deployment

1. Use existing Dockerfile or create worker-specific ones:

   ```dockerfile
   # apps/platform-api/Dockerfile.momo-poller
   FROM node:20-alpine
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN corepack enable && pnpm install --prod --frozen-lockfile
   COPY . .
   RUN pnpm build
   CMD ["node", "dist/workers/momo-poller.js"]
   ```

2. Deploy to your platform of choice

### Option 3: Supabase Edge Functions

Since the workers interact with Supabase, consider moving them to Supabase Edge
Functions:

1. Create edge functions in `supabase/functions/`
2. Use Supabase's pg_cron extension to trigger them on schedule
3. Deploy with: `supabase functions deploy worker-name`

Benefits:

- Direct database access (no API calls)
- Built-in authentication
- Integrated with existing Supabase setup
- No additional infrastructure needed

## Current Implementation Status

The platform-api workers are **stubs** with minimal implementation. Before
deployment:

1. **Complete worker implementation**:
   - Add actual MoMo API integration
   - Add GSM modem communication logic
   - Add error handling and retry logic
   - Add monitoring and alerting

2. **Add tests**:
   - Unit tests for worker logic
   - Integration tests with Supabase
   - Load tests for performance

3. **Choose deployment strategy** based on:
   - Cost considerations
   - Scaling requirements
   - Team expertise
   - Existing infrastructure

## Recommended Approach

For the Ibimina project, I recommend:

1. **Short term**: Deploy to **Fly.io** or **Railway** using Docker
   - Quick to set up
   - Good monitoring
   - Scales automatically
   - Cost-effective for low/medium traffic

2. **Long term**: Migrate to **Supabase Edge Functions**
   - Consistent with rest of stack
   - Direct database access
   - Built-in scheduling via pg_cron
   - One less external service to manage

## Next Steps

1. Review and complete worker implementation in `apps/platform-api/src/workers/`
2. Add comprehensive tests
3. Choose deployment platform
4. Set up CI/CD pipeline
5. Configure monitoring and alerting
6. Document operational procedures

## Files That Need Attention

- `apps/platform-api/src/workers/momo-poller.ts` - Incomplete
- `apps/platform-api/src/workers/gsm-heartbeat.ts` - Incomplete
- `apps/platform-api/tests/` - Need test coverage
- `apps/platform-api/package.json` - Add deployment scripts

## References

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Fly.io Docs](https://fly.io/docs/)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)
