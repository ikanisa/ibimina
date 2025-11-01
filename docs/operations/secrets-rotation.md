# Secrets Rotation & Incident Response Runbook

This runbook documents how Ibimina manages application secrets inside AWS
Secrets Manager, how automated rotation works, and what to do if a secret is
suspected to be compromised.

## Rotation Cadence

| Secret Category    | Examples                                                    | Rotation Policy                                                                   |
| ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Crypto material    | `FIELD_ENCRYPTION_KEY`, MFA/session keys                    | Rotated automatically every 90 days by the AWS Lambda rotation handler.           |
| Third-party tokens | OpenAI API key, log drain tokens, Supabase service role key | Reviewed quarterly. Rotate immediately if provider mandates or after an incident. |
| Operational tokens | Cloudflare API token, VAPID keys                            | Rotate every 180 days or when staff with access changes.                          |

_Terraform variable `secret_rotation_days` controls the automatic cadence. Use
`terraform apply` after changing the value so Secrets Manager updates its
schedule._

## Automated Rotation Flow

1. Terraform provisions the `ibimina-app-secrets` entry in AWS Secrets Manager.
2. A dedicated Lambda function (`<project>-<env>-secrets-rotation`) is invoked
   by AWS every 90 days.
3. The function copies the current secret JSON payload, generates a new 32-byte
   encryption key, timestamps the rotation (`LAST_ROTATED_AT`), and stores the
   result as the pending version.
4. After validation, AWS promotes the pending version to `AWSCURRENT`.
5. Deployment pipelines fetch the latest values dynamically via
   `scripts/load-aws-secrets.sh`, so no manual updates are required in CI.

## Manual Rotation Checklist

1. Update any values that the Lambda does not rotate automatically (e.g., API
   tokens) inside Secrets Manager.
2. Trigger an on-demand rotation from the AWS console or via
   `aws secretsmanager rotate-secret --secret-id <id>`.
3. Monitor the Lambda logs (`/aws/lambda/<project>-<env>-secrets-rotation`) for
   success confirmation.
4. Re-run the affected deployment workflow to ensure new values are in use.

## Incident Response

When you suspect a secret compromise:

1. **Contain** – Disable or revoke the exposed credentials at their source
   (e.g., reset the OpenAI key, disable the log drain webhook).
2. **Rotate** – Update the secret in AWS Secrets Manager with replacement values
   and invoke an immediate rotation to refresh derived keys.
3. **Purge** – Redeploy all affected services. GitHub Actions workflows now
   fetch secrets dynamically, so redeploying ensures the new values are
   propagated.
4. **Audit** – Review AWS CloudTrail, GitHub Actions logs, and application
   access logs to understand blast radius.
5. **Document** – Record the incident in the findings register and update this
   runbook with any lessons learned.

## Verification

- GitHub Actions steps "Load runtime secrets" should report the number of keys
  fetched without logging values.
- `terraform plan` should show `aws_secretsmanager_secret_rotation` configured
  with the desired cadence.

Maintaining this process keeps secrets out of plaintext logs and enforces a
consistent, automated rotation discipline.
