# API Surface

## Stability levels

- **Stable**: `eslint-plugin-ibimina` exports its rule set via
  `index.public.ts`, which re-exports the default plugin configuration.
- **Supported subpaths**: Consume the plugin through the package root when
  configuring ESLint.
- **Private**: Direct imports into rule files or `../internal/*` style paths are
  not supported and may change.

## Deprecations

- None.

## Notes

Use the published plugin entrypoint in ESLint configs; new rules will be
surfaced through the public export map.
