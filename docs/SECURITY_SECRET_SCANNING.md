# Secret scanning and remediation

Ibimina repositories now enforce automated secret scanning using
[Gitleaks](https://github.com/gitleaks/gitleaks). The scan executes on every
pull request and on pushes to `main` via `.github/workflows/security.yml` and
uses the configuration in `.gitleaks.toml`.

## Workflow overview

1. **Checkout** – the action clones the repo with full history to ensure
   baseline coverage.
2. **Scan** – `gitleaks detect` runs with redaction enabled and publishes a
   SARIF report to GitHub Security.
3. **Reporting** – failures surface in the GitHub UI and `gitleaks.sarif` is
   uploaded as an artifact for triage.

## Handling findings

Follow this checklist whenever a run fails:

1. **Identify the secret**
   - Review the SARIF report in the workflow run or the “Security” tab.
   - Confirm whether the match is a real secret or a false positive placeholder.
2. **Revoke or rotate real secrets**
   - Immediately rotate keys in the upstream provider (Supabase, Resend, OpenAI,
     etc.).
   - Update CI/CD or secret managers with the new value; never commit real
     credentials.
3. **Purge the repository of sensitive data**
   - Replace committed secrets with placeholders (e.g. `__REPLACE_WITH_*__`).
   - Force-rotate exposed tokens even if the commit is reverted, then invalidate
     cached artifacts if necessary.
4. **Document mitigation**
   - Reference this guide in the pull request summary.
   - Add narrowly scoped allowlist entries to `.gitleaks.toml` only for
     deterministic fixtures.
5. **Re-run the scan**
   - Locally execute
     `/tmp/gitleaks detect --source . --config .gitleaks.toml --no-git --redact`.
   - Commit remediation changes and push; the workflow must pass before merge.

## Local tooling

A prebuilt Gitleaks binary is fetched in CI. To mirror the workflow locally:

```bash
curl -sSL https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz \
  | tar -xz -C /tmp
/tmp/gitleaks detect --source . --config .gitleaks.toml --no-git --redact
```

Only add new allowlist entries after verifying that the match is a deterministic
fixture or placeholder. All other findings should result in credential rotation
and repository scrubbing.
