# UI Debugging Steps

## To help diagnose the "messy UI" issue, please provide:

### 1. Screenshot

If possible, attach a screenshot of what you're seeing

### 2. Browser Console Errors

Open browser dev tools (F12) and check:

- Console tab: Any red errors?
- Network tab: Is `layout.css` loading? (Status 200?)

### 3. Which page are you on?

- `/` (redirects to dashboard/login)
- `/login`
- `/dashboard`
- Other?

### 4. What specifically looks wrong?

- [ ] No colors/styling at all (plain HTML)
- [ ] Layout broken (elements overlapping/misplaced)
- [ ] Fonts not loading
- [ ] Dark mode when should be light
- [ ] Other (describe):

## Quick Checks I Can Run Now:

```bash
# 1. Check if CSS is being served
curl -I http://localhost:3100/_next/static/css/app/layout.css

# 2. Check CSS size
ls -lh apps/pwa/staff-admin/.next/static/css/app/layout.css

# 3. Check first 100 lines of compiled CSS
head -100 apps/pwa/staff-admin/.next/static/css/app/layout.css
```

## Common Issues & Fixes:

### Issue: CSS Not Loading

**Symptoms:** Plain unstyled HTML **Fix:** Clear .next cache and rebuild

```bash
cd apps/pwa/staff-admin && rm -rf .next && pnpm dev
```

### Issue: CSS Variables Not Defined

**Symptoms:** Colors missing, layout partially working **Fix:** Check if
tokens.css is being imported

```bash
grep "tokens.css" apps/pwa/staff-admin/app/globals.css
grep "color-primary" apps/pwa/staff-admin/styles/tokens.css
```

### Issue: Tailwind Not Processing

**Symptoms:** Utility classes not working (e.g., `bg-blue-500` doesn't work)
**Fix:** Verify PostCSS is running

```bash
cd apps/pwa/staff-admin && pnpm exec postcss --version
```

### Issue: Wrong Theme Applied

**Symptoms:** Dark mode when should be light **Fix:** Check theme provider in
layout

```bash
grep "data-theme" apps/pwa/staff-admin/app/layout.tsx
```

---

## My Analysis So Far:

✅ **CSS IS being generated** - `layout.css` exists (111KB) ✅ **PostCSS IS
installed** - Added in package.json ✅ **Tailwind config IS valid** - Points to
correct content paths ✅ **tokens.css EXISTS** - In styles/tokens.css ✅
**globals.css imports tokens** - @import "../styles/tokens.css"

**Most likely causes:**

1. Browser not loading the CSS (network issue)
2. CSS loaded but theme variables not applied correctly
3. Specific components have inline style issues
4. Font files not loading

Please describe what you see or share a screenshot so I can fix the exact issue!
