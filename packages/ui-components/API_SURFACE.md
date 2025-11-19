# API Surface

## Stability levels

- **Stable**: `@ibimina/ui-components` exposes shared React primitives (Card,
  Button, Badge) via `src/index.public.ts`.
- **Supported subpaths**: Use the root package import; individual components are
  surfaced through the public entrypoint.
- **Private**: File-level imports or `../internal/*` references are not
  supported.

## Deprecations

- None.

## Notes

Consume components through the root export to keep shared UI usage consistent.
