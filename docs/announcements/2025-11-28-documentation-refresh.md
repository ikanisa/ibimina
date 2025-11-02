# Documentation Refresh Ready for Review — 2025-11-28

Team,

The documentation set for the refactored architecture is ready for review. Key
updates:

- New runbooks for architecture, operations, security, mobile release, PWA
  readiness, and API contracts under `docs/runbooks/`.
- Updated project structure map (`docs/PROJECT_STRUCTURE.md`) reflecting the
  Next.js 16 staff console, member PWA, Expo mobile app, and platform workers.
- Refreshed quick reference and onboarding guides with Makefile wrappers
  (`make quickstart`, `make release`) so new engineers can ship within a day.

## Requested Reviewers

| Area         | Reviewer             | Notes                                           |
| ------------ | -------------------- | ----------------------------------------------- |
| Architecture | @tech-leads          | Validate diagrams + shared packages coverage    |
| Operations   | @release-engineering | Confirm release + incident steps match playbook |
| Security     | @security            | Review rotation cadence + device auth guidance  |
| Mobile       | @mobile-team         | Sanity check EAS instructions                   |

Please leave comments directly in the referenced docs or reply in #docs with
blocking feedback by **2025-11-30**. After sign-off we will archive the legacy
runbook references.

Thanks!
