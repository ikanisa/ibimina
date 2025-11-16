# API Surface

## Stability levels

- **Stable**: Import `@ibimina/data-access` to access the database client,
  schemas, and queries exported from `src/index.public.ts`.
- **Supported subpaths**: The grouped queries under `queries/*`, the client, and
  schemas are exposed via the public entrypoint and should be consumed from the
  root import.
- **Private**: Any other path (including relative `../internal/*` or file-level
  imports) is not supported.

## Deprecations

- None.

## Notes

Stick to the root export to ensure future refactors of query organization do not
affect consumers.
