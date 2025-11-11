# Environment Setup - Quick Reference

## ⚡ Quick Fix (You Just Hit This Error)

The app needs Supabase credentials. Here's the fastest solution:

### Option 1: Local Development with Stub (Fastest)
```bash
# Add to .env.local
echo 'NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=stub-key
SUPABASE_SERVICE_ROLE_KEY=stub-key' > .env.local

# Restart dev server
pnpm dev
```

### Option 2: Use Your Supabase Project (Recommended)
1. Go to: https://app.supabase.com/project/_/settings/api
2. Copy these values:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key
3. Add to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
4. Restart: `pnpm dev`

### Option 3: Local Supabase (Full Stack)
```bash
# Start local Supabase
supabase start

# Copy the credentials shown
# Add to .env.local

# Restart
pnpm dev
```

## 📁 Environment Files

- `.env` - Base configuration with auto-generated secrets (✅ created)
- `.env.local` - Your Supabase credentials (⚠️ you need to add these)
- `.env.example` - Template for reference

## 🔐 Required Variables

These are auto-generated in `.env` (already done):
- `KMS_DATA_KEY_BASE64` ✅
- `BACKUP_PEPPER` ✅
- `MFA_SESSION_SECRET` ✅
- `TRUSTED_COOKIE_SECRET` ✅
- `HMAC_SHARED_SECRET` ✅

These you need to add in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` ❌
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ❌
- `SUPABASE_SERVICE_ROLE_KEY` ❌

## 🛠️ Helper Script

Run for guided setup:
```bash
./setup-env.sh
```

## 🔄 After Changing Environment

Always restart the dev server:
```bash
# Kill current server
pkill -f 'next dev'  # or Ctrl+C

# Start again
pnpm dev
```

## 🚨 Common Issues

**Error: "NEXT_PUBLIC_SUPABASE_URL is required"**
- Add Supabase credentials to `.env.local`

**Error: "Connection refused"**
- Check if Supabase is running: `supabase status`
- Or use remote Supabase project

**Changes not taking effect**
- Restart dev server
- Clear Next.js cache: `rm -rf .next`

## 📚 More Info

- Full setup guide: `README.md`
- Quick start: `QUICK_START.md`
- Copilot instructions: `.github/copilot-instructions.md`
