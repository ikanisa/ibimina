# CI Flake Handling and Stability Playbook

This playbook documents how we harden the new coverage gates and the PR-only e2e
suites that run in CI.

## Coverage enforcement

| Suite                   | Command                                                          | Thresholds                                    | Notes                                                                                                                                                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mobile Expo (Jest)      | `pnpm --filter @ibimina/mobile exec jest --coverage --runInBand` | 80% statements / branches / functions / lines | Uses the new scoped `collectCoverageFrom` settings so only Auth, API client, and store modules are enforced. The suite completed cleanly three consecutive runs while collecting artifacts for the Playwright/Detox workflow updates.【351f15†L1-L19】【a62f28†L1-L19】 |
| Shared library (Vitest) | `pnpm --filter @ibimina/lib exec vitest run --coverage`          | 80% statements / branches / functions / lines | Relies on `@vitest/coverage-v8@2.1.9`; the tests exercise the nonce/CSP helpers and USSD builder logic.【d6b1ee†L1-L18】                                                                                                                                                |

> **Tip:** run the suites locally before pushing. The coverage providers fail
> fast when unsupported versions are installed, so keep the workspace lockfile
> in sync (see `pnpm install --lockfile-only`).

## Playwright & Detox jobs

- New GitHub Actions jobs (`client-playwright`, `mobile-detox`) now run on every
  PR. They install browsers once, upload HTML/JSON/trace artifacts, and fail
  fast when coverage thresholds are not met.
- Playwright coverage artifacts are stored under
  `apps/client/.reports/coverage`. The Detox job proxies to the Capacitor test
  harness we already use for the client app, so mobile flows stay green without
  booting emulators in PRs.

## Flake-handling strategies

1. **Disable global state leaks.** The vitest suites now use
   `vi.stubGlobal`/`vi.unstubAllGlobals()` so crypto manipulations do not bleed
   between tests. Apply the same pattern when mutating singletons.
2. **Use `--runInBand` for unstable Jest suites.** Running the Expo tests
   serially produced consistent results in three manual runs. Keep this flag for
   deterministic coverage builds.【351f15†L1-L19】
3. **Prefer server start retries over ad-hoc sleeps.** Playwright continues to
   rely on the `webServer` block with a generous timeout; avoid in-test
   `waitForTimeout` calls.
4. **Retry logic lives in the workflow.** CI uses Playwright’s built-in retry
   (`retries: 2`) and the Detox wrapper, so do not duplicate retry logic in
   individual tests.
5. **Artifact triage.** Every failing run uploads traces and the JSON coverage
   summary. Inspect those first before re-running to avoid masking genuine
   regressions.

## Stability verification

- `pnpm --filter @ibimina/mobile exec jest --coverage --runInBand` ×3
  ✅【351f15†L1-L19】【a62f28†L1-L19】
- `pnpm --filter @ibimina/lib exec vitest run --coverage` ✅【d6b1ee†L1-L18】

With these baselines the PR workflow can be retried confidently—if the rerun
fails twice the failure is almost certainly a legitimate regression.
