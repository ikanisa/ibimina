# QUICK START - Staff Admin PWA

## ⚠️ Important: Monorepo Context

This PWA was generated **inside a monorepo** (`/Users/jeanbosco/workspace/ibimina`). 

**You have 2 options:**

---

## Option 1: Run as Standalone Project (Recommended)

### Step 1: Extract to Standalone Directory

```bash
# From your current location
cd /Users/jeanbosco/workspace

# Create standalone copy
mkdir staff-admin-pwa-app
cp -r ibimina/staff-admin-pwa/* staff-admin-pwa-app/
cp -r ibimina/staff-admin-pwa/.* staff-admin-pwa-app/ 2>/dev/null || true

# Navigate to standalone
cd staff-admin-pwa-app
```

### Step 2: Install Dependencies

```bash
# Install with npm (simpler for standalone)
npm install

# Or with pnpm
pnpm install --no-frozen-lockfile
```

### Step 3: Run

```bash
# Development
npm run dev
# or
pnpm dev

# Build
npm run build
# or
pnpm build
```

---

## Option 2: Integrate into Existing Monorepo

If you want to keep it in the monorepo, you need to:

### Step 1: Update Root `pnpm-workspace.yaml`

Add to `/Users/jeanbosco/workspace/ibimina/pnpm-workspace.yaml`:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'staff-admin-pwa'  # Add this line
```

### Step 2: Remove Conflicting Scripts

Edit `staff-admin-pwa/package.json`, remove these scripts that conflict with monorepo:

```json
{
  "scripts": {
    // Remove or comment these:
    // "prepare": "husky",
    // "postinstall": "husky install"
  }
}
```

### Step 3: Install from Monorepo Root

```bash
cd /Users/jeanbosco/workspace/ibimina
pnpm install
```

### Step 4: Run from Monorepo

```bash
# From monorepo root
cd /Users/jeanbosco/workspace/ibimina

# Run dev server
pnpm --filter staff-admin-pwa dev

# Build
pnpm --filter staff-admin-pwa build
```

---

## Quick Test (No Installation Required)

If you just want to see what was generated:

```bash
cd /Users/jeanbosco/workspace/ibimina/staff-admin-pwa

# View the structure
ls -la

# Read documentation
cat README.md
cat BUILD.md
cat HOSTING.md

# View source files
ls src/
ls src/pages/
ls src/components/
```

---

## Recommended Approach

**For immediate use:** Choose **Option 1** (Standalone)

**Reasoning:**
- No monorepo complexity
- All dependencies install cleanly
- Standard npm/pnpm scripts work
- Docker/Nginx configs work out of the box
- Easier to deploy separately

**Commands:**

```bash
# Quick copy-paste
cd /Users/jeanbosco/workspace
cp -r ibimina/staff-admin-pwa staff-admin-pwa-app
cd staff-admin-pwa-app
npm install
npm run dev
```

Then open **http://localhost:3000**

Login: **admin@example.com** / **password**

---

## What You Have

All files are **100% complete**:
- ✅ 55+ source files
- ✅ 6 pages (Login, Dashboard, Users, Orders, Tickets, Settings)
- ✅ PWA with service worker
- ✅ Mock API with MSW
- ✅ Docker + Nginx configs
- ✅ CI/CD workflows
- ✅ Complete documentation

---

## Next Steps

1. **Extract** to standalone directory (Option 1)
2. **Install** dependencies
3. **Run** `npm run dev`
4. **Explore** the app
5. **Read** BUILD.md and HOSTING.md for full instructions

---

## Need Help?

See:
- `README.md` - Full overview
- `BUILD.md` - Build instructions
- `HOSTING.md` - Hosting options
- `RUNBOOK.md` - Operations guide
- `PROJECT_SUMMARY.md` - Complete summary
