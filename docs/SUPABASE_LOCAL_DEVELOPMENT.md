# Supabase Local Development

This guide explains how to use Supabase CLI for local development and troubleshooting common issues.

## Installation

The Supabase CLI is required for local development, migrations, and type generation.

### Quick Install

```bash
# Using the install script (recommended)
./scripts/install-supabase-cli.sh

# Manual installation (Linux/macOS)
curl -sL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz -o /tmp/supabase.tar.gz
tar -xzf /tmp/supabase.tar.gz -C /tmp
sudo mv /tmp/supabase /usr/local/bin/
```

### Verify Installation

```bash
supabase --version
# Should output: 2.54.11 or later
```

## Local Development Setup

### Starting Supabase

```bash
# Start all Supabase services locally
supabase start

# Start without edge functions (if encountering issues)
supabase start --exclude edge-runtime

# View status
supabase status
```

### Stopping Supabase

```bash
# Stop all services
supabase stop

# Stop and remove all data
supabase stop --no-backup
```

## Common Use Cases

### 1. Generate TypeScript Types

After making database schema changes:

```bash
# For local development
pnpm gen:types

# Or manually
supabase gen types typescript --local > apps/admin/lib/supabase/types.ts
```

### 2. Run Migrations

```bash
# Apply all migrations
supabase db reset

# Create a new migration
supabase migration new <migration-name>

# Push migrations to remote
supabase db push
```

### 3. Link to Remote Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref vacltfdslodqybxojytc
```

### 4. Edge Functions

```bash
# Serve a function locally
supabase functions serve <function-name>

# Deploy a function
supabase functions deploy <function-name>

# View function logs
supabase functions logs <function-name>
```

## Troubleshooting

### Issue: Docker DNS Resolution Failures

**Symptoms:**
- `Error: getaddrinfo EAI_AGAIN supabase_db_*`
- Containers can't resolve each other's hostnames
- `could not translate host name "supabase_db_*" to address: Try again`

**Cause:**
Docker's embedded DNS server (127.0.0.11) may not work properly in some environments, particularly:
- CI/CD environments (GitHub Actions, GitLab CI)
- Nested containerization
- Certain network configurations

**Solutions:**

#### Solution 1: Configure Docker DNS (Recommended)

Create or update `/etc/docker/daemon.json`:

```json
{
  "dns": ["8.8.8.8", "8.8.4.4"]
}
```

Then restart Docker:

```bash
sudo systemctl restart docker
```

#### Solution 2: Use Remote Supabase Instead

If local development is problematic, use the remote Supabase instance:

```bash
# Generate types from remote
supabase gen types typescript --project-id vacltfdslodqybxojytc > apps/admin/lib/supabase/types.ts

# Test against remote database
export SUPABASE_URL="https://vacltfdslodqybxojytc.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

#### Solution 3: Exclude Problematic Services

```bash
# Start without edge runtime (common source of DNS issues)
supabase start --exclude edge-runtime

# Or exclude multiple services
supabase start --exclude edge-runtime,vector,logflare
```

### Issue: Port Conflicts

**Symptoms:**
- `Error: bind: address already in use`

**Solution:**

```bash
# Check what's using Supabase ports
netstat -tuln | grep -E "(54321|54322|54323|54324)"

# Stop conflicting services or change Supabase ports in config.toml
```

### Issue: SSL Certificate Errors in Edge Functions

**Symptoms:**
- `invalid peer certificate: UnknownIssuer`
- Edge Functions failing to start

**Solution:**

This is usually due to Deno (used by Edge Functions) not trusting system certificates. Exclude edge-runtime:

```bash
supabase start --exclude edge-runtime
```

Or update system certificates:

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates
sudo update-ca-certificates
```

### Issue: Database Connection Timeouts

**Symptoms:**
- `dial tcp 127.0.0.1:54322: i/o timeout`
- Database container exits immediately

**Solution:**

1. Check Docker logs:
```bash
docker logs supabase_db_vacltfdslodqybxojytc
```

2. Ensure Docker has enough resources (especially in CI):
```bash
docker system info | grep -E "Memory|CPUs"
```

3. Try with increased timeout:
```bash
export SUPABASE_DB_START_TIMEOUT=120
supabase start
```

## CI/CD Considerations

### GitHub Actions

In GitHub Actions, Docker's embedded DNS may not work reliably. Consider these approaches:

#### Option 1: Use Service Containers

```yaml
services:
  postgres:
    image: supabase/postgres:17.6.1.029
    env:
      POSTGRES_PASSWORD: postgres
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 54322:5432
```

#### Option 2: Skip Local Supabase

```yaml
- name: Generate types from remote
  run: |
    supabase gen types typescript --project-id ${{ secrets.SUPABASE_PROJECT_REF }} > apps/admin/lib/supabase/types.ts
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

#### Option 3: Use Docker Compose

```yaml
- name: Start Supabase
  run: docker-compose -f docker-compose.supabase.yml up -d
```

## Environment Variables

Required for local development:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<get from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<get from supabase status>
```

Get these values after starting Supabase:

```bash
supabase status
```

## Best Practices

1. **Always check status before working:**
   ```bash
   supabase status
   ```

2. **Reset database for clean state:**
   ```bash
   supabase db reset
   ```

3. **Keep migrations in sync:**
   ```bash
   # After pulling changes
   supabase db reset
   ```

4. **Generate types after schema changes:**
   ```bash
   pnpm gen:types
   ```

5. **Use `.env.local` for secrets:**
   - Never commit `.env.local`
   - Use `.env.example` as template

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli)
- [Local Development Guide](https://supabase.com/docs/guides/cli/local-development)
- [Database Migrations](https://supabase.com/docs/guides/cli/managing-environments)
- [Edge Functions](https://supabase.com/docs/guides/functions)

## Project-Specific Notes

This project (`vacltfdslodqybxojytc`) uses:
- PostgreSQL 17.6 with custom extensions
- Row-Level Security (RLS) policies
- Multiple schemas: `public`, `storage`, `graphql_public`, `app`, `app_helpers`
- 30+ Edge Functions
- 18+ database migrations

See `supabase/config.toml` for full configuration.
