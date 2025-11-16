# Tailwind v3 Migration (Stability Fix)

## Why Downgrade from v4 to v3?

- v4 is new (beta/alpha features)
- v3 is stable, well-documented
- Existing configs are v3 format
- Less breaking changes

## Changes Required

### 1. Package versions

```json
"tailwindcss": "^3.4.0",
"autoprefixer": "^10.4.20"
```

Remove: `"@tailwindcss/postcss": "^4"`

### 2. PostCSS config

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 3. CSS file

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 4. Keep tailwind.config.ts as-is

(Already in v3 format)
