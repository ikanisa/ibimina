# API Surface

## Stability levels

- **Stable**: Importing `@ibimina/api-contracts` resolves to
  `src/index.public.ts`, which re-exports the supported contract definitions.
- **Supported subpaths**: `@ibimina/api-contracts/tapmomo` and
  `@ibimina/api-contracts/allocations` remain available for direct access to
  those schemas.
- **Private**: Any other file-level path (including `../internal/*` style
  imports) is considered internal and may change without notice.

## Deprecations

- None at this time.

## Notes

Use the package export map rather than deep imports so the public surface can
remain stable.
