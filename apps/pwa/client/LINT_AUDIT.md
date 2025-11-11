# apps/client ESLint Audit

_Date:_ 2025-11-01T00:17:57Z

## Summary

- **Quick fixes applied:**
  - Removed unused React imports/props in `app/(auth)/login/page.tsx`.
  - Ensured placeholder API routes use validated inputs without triggering
    unused-variable rules.
  - Converted GET handlers to omit unused `request` parameters across API
    routes.
  - Escaped literal quotes in `app/terms/page.tsx`.
  - Introduced typed filter options in `app/wallet/page.tsx` to eliminate `any`
    usage.
  - Personalised AI chat greeting with the provided `orgId` to avoid unused-prop
    warnings.
  - Swapped `<img>` for Next.js `<Image>` in
    `components/loans/loan-product-card.tsx`.
  - Trimmed unused icons from `components/ui/enhanced-bottom-nav.tsx`.
  - Tightened device-auth typings to remove explicit `any` usage and return the
    enrollment identifier.

- **Intentional exceptions:** None remaining. All previous warnings were
  resolved directly without permanent rule overrides.

## Follow-up

Should new lint suppressions be required, annotate them with
`TODO(client-lint):` and link to a tracking ticket. The CI workflow enforces
this policy whenever the dedicated `@ibimina/client` lint run fails.
