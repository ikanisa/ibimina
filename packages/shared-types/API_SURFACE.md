# API Surface

## Stability levels

- **Stable**: `@ibimina/shared-types` exposes shared type definitions via
  `src/index.public.ts`.
- **Supported subpaths**: Use the root import for common and multicountry types.
- **Private**: Any other path, including `../internal/*`, is not part of the
  supported surface.

## Deprecations

- None.

## Notes

Stick to the root export to ensure type definitions remain compatible across
packages.
