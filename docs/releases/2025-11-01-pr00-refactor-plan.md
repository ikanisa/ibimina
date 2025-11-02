# Release 0.1.4 — Refactor planning (2025-11-01)

Highlights

- Added `docs/REFACTOR_PLAN.md` with an inventory of every app, package, and
  pipeline feeding the Ibimina platform.
- Recorded the risk register, dependency outlook, and the ordered PR sequence to
  guide the production-readiness programme.

Changes

- Documentation
  - New `docs/REFACTOR_PLAN.md` covering applications, shared packages,
    automation, and risks.
  - CHANGELOG entry for 0.1.4 linking to this release note.

Migrations

- Database: none.
- Infrastructure: none.

Verification

- Documentation-only change. No build, lint, or test commands were executed for
  this planning PR.

Notes

- Subsequent PRs (`01` → `10`) will each ship targeted changes (tooling, PWA,
  mobile, backend, docs) as outlined in the plan.
- Keep this release note referenced in future updates so reviewers can trace the
  rationale behind the sequence.
