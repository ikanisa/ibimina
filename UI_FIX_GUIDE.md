# UI Issues - Quick Fix Guide

## Status Check

✅ **Server is running** - No more ZodError  
✅ **CSS is generating** - layout.css is 108KB  
✅ **CSS is being served** - HTTP 200 response  
✅ **Tailwind is working** - Utility classes present  
✅ **Tokens loaded** - CSS variables defined

## If You See "Messy UI", Try These Fixes:

### Fix 1: Hard Refresh Browser

```bash
# In your browser:
# - Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
# - Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
# - Safari: Cmd+Option+R
```

### Fix 2: Clear Browser Cache

```bash
# Open Dev Tools (F12)
# Right-click the refresh button → "Empty Cache and Hard Reload"
```

### Fix 3: Rebuild CSS with Clean Cache

```bash
cd apps/pwa/staff-admin
rm -rf .next
pnpm dev
```

### Fix 4: Check Browser Console

Open browser Dev Tools (F12) and look for:

- **Console tab:** Any red errors about CSS?
- **Network tab:** Is `layout.css` loading? Status 200?
- **Elements tab:** Are CSS styles being applied to elements?

### Fix 5: Verify CSS is Loading in Browser

```javascript
// Paste in browser console:
console.log(document.styleSheets.length + " stylesheets loaded");
Array.from(document.styleSheets).forEach((s) => console.log(s.href));
```

### Fix 6: Check if You're on Login Page

The login page might look different from the main app. Try:

1. Go to http://localhost:3100/login
2. Check if styling is there
3. If not, check browser console for errors

## Common Symptoms & Solutions:

### Symptom: Completely Unstyled (Plain Black Text on White)

**Cause:** CSS not loading or blocked by CSP  
**Fix:**

```bash
# Check CSP headers aren't blocking CSS
curl -I http://localhost:3100 | grep -i "content-security-policy"

# Rebuild with clean cache
cd apps/pwa/staff-admin && rm -rf .next && pnpm dev
```

### Symptom: Some Styles Work, Others Don't

**Cause:** CSS variables not defined  
**Fix:** Check if tokens.css is actually in the bundle:

```bash
grep "color-primary" apps/pwa/staff-admin/.next/static/css/app/layout.css
# Should show CSS variable definitions
```

### Symptom: Wrong Colors/Theme

**Cause:** Theme cookie or dark mode issue  
**Fix:**

```bash
# Clear theme cookie
# In browser console:
document.cookie = "theme=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
location.reload();
```

### Symptom: Fonts Not Loading

**Cause:** Font files blocked or missing  
**Fix:** Check network tab in dev tools for failed font requests

### Symptom: Layout Broken But Colors Work

**Cause:** Flexbox/Grid CSS not applied  
**Fix:** Check if Tailwind base styles are in the CSS:

```bash
head -200 apps/pwa/staff-admin/.next/static/css/app/layout.css | grep "flex\|grid"
```

## Diagnostic Commands:

```bash
# 1. Verify CSS file exists and has content
ls -lh apps/pwa/staff-admin/.next/static/css/app/layout.css

# 2. Check if Tailwind directives are processed
head -50 apps/pwa/staff-admin/.next/static/css/app/layout.css

# 3. Verify PostCSS is working
cd apps/pwa/staff-admin && pnpm list postcss

# 4. Check if globals.css imports are correct
grep "@import\|@tailwind" apps/pwa/staff-admin/app/globals.css

# 5. Test CSS loads in curl
curl -I http://localhost:3100/_next/static/css/app/layout.css
```

## If Nothing Works:

### Nuclear Option - Full Rebuild

```bash
cd apps/pwa/staff-admin

# 1. Stop dev server (Ctrl+C)

# 2. Delete everything
rm -rf .next node_modules

# 3. Reinstall
cd ../../..
pnpm install --frozen-lockfile

# 4. Start fresh
cd apps/pwa/staff-admin
pnpm dev
```

## Take a Screenshot

If none of this fixes it, please:

1. Take a screenshot of what you see
2. Open browser Dev Tools (F12)
3. Share any console errors (red text)
4. Check Network tab - is `layout.css` status 200 or failing?

Then I can provide the exact fix for your specific issue.

---

## What I've Verified:

✅ PostCSS is installed  
✅ Tailwind config is correct  
✅ globals.css has @tailwind directives  
✅ tokens.css exists and is imported  
✅ CSS compiles to 108KB  
✅ CSS served with HTTP 200  
✅ Tailwind utilities present in CSS  
✅ Layout.tsx has correct className structure

**The CSS infrastructure is working correctly.** The issue is likely:

- Browser cache
- CSP blocking resources
- JavaScript not hydrating properly
- Specific page/component issue

Please try the fixes above and let me know what you see!
