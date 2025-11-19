# API Surface

## Stability levels

- **Stable**: `@ibimina/tapmomo-proto` exposes the TapMoMo payload schema and
  helpers via `src/index.public.ts`.
- **Supported subpaths**: Use the root import for payload helpers and types.
- **Private**: File-level imports or `../internal/*` paths are not supported.

## Deprecations

- None.

## Notes

Import signing and validation helpers from the root entrypoint to keep
integrations stable.
