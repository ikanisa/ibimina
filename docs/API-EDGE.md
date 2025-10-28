# SACCO+ Edge Functions

All functions live under `supabase/functions/` and deploy to
`https://<project-ref>.functions.supabase.co/<name>`. The table below summarises
endpoints, auth, and rate limits.

| Function           | Route               | Method(s)     | Auth                                                                                          | Rate limit            |
| ------------------ | ------------------- | ------------- | --------------------------------------------------------------------------------------------- | --------------------- |
| `sms-inbox`        | `/sms/inbox`        | `POST`        | HMAC headers `x-signature` + `x-timestamp` (`HMAC_SHA256(secret, ts + method + path + body)`) | 60 req/min/IP         |
| `ingest-sms`       | `/ingest-sms`       | `POST`        | HMAC headers `x-signature` + `x-timestamp`                                                    | 60 req/min/project    |
| `metrics-exporter` | `/metrics-exporter` | `GET`         | HMAC headers `x-signature` + `x-timestamp` (60s skew)                                         | 12 req/min/source     |
| `sms-ai-parse`     | `/sms/ai-parse`     | `POST`        | Staff/system-admin JWT or service-role key                                                    | 20 req/min/user       |
| `payments-apply`   | `/payments/apply`   | `POST`        | Staff/system-admin JWT (`x-idempotency-key` required)                                         | 20 req/min/user       |
| `recon-exceptions` | `/recon/exceptions` | `GET`, `POST` | Staff/system-admin JWT                                                                        | 40 mutations/min/user |
| `reports-export`   | `/reports/export`   | `GET`         | Staff/system-admin JWT                                                                        | Default project limit |
| `admin-reset-mfa`  | `/admin/reset-mfa`  | `POST`        | System-admin JWT                                                                              | 10 req/min/user       |
| `mfa-email`        | `/mfa-email`        | `POST`        | Service-role (invoked server-side)                                                            | 120 req/min/project   |

## Payloads

### `/sms/inbox` – GSM modem webhook

```http
POST /sms/inbox
Content-Type: text/plain
x-timestamp: 2025-10-01T12:00:00Z
x-signature: <hex hmac>

You have received RWF 20,000 from 0788...
```

Or JSON:

```json
{
  "text": "You have received RWF 20,000...",
  "receivedAt": "2025-10-01T12:00:00Z",
  "saccoId": "<uuid>",
  "vendorMeta": {
    "modemPort": "usb0"
  }
}
```

Signatures use the formula
`HMAC_SHA256(HMAC_SHARED_SECRET, <timestamp><method>:<path><raw body>)`. The
`<path>` must include the `/functions/v1` prefix when invoking via the Supabase
edge runtime. Reject requests where `x-timestamp` is older than five minutes to
prevent replay.

### `/ingest-sms`

```http
POST /ingest-sms
Content-Type: application/json
x-timestamp: 2025-10-09T07:21:12Z
x-signature: <hex hmac>

{"rawText":"15000 AIRTEL ...","receivedAt":"2025-10-09T07:21:12Z"}
```

The ingestion endpoint mirrors the `sms-inbox` signature scheme but is designed
for authenticated infrastructure (modems, ETL runners). Invalid or replayed
signatures return HTTP 401/408 with a JSON error payload.

### `/metrics-exporter`

```http
GET /metrics-exporter
x-timestamp: 2025-10-01T12:00:00Z
x-signature: <hex hmac>
```

Prometheus scrapes must include the `x-timestamp` header (UTC ISO string) and
`x-signature` calculated over
`timestamp + "GET:/functions/v1/metrics-exporter"`. The exporter rejects
signatures older than 60 seconds.

**Response**

```json
{
  "id": "<sms-inbox-id>",
  "status": "POSTED|UNALLOCATED|NEW",
  "paymentId": "<uuid|null>",
  "saccoId": "<uuid|null>"
}
```

### `/sms/ai-parse`

```json
POST /sms/ai-parse
{
  "smsInboxId": "<uuid>"
}
```

**Response**

```json
{
  "smsInboxId": "<uuid>",
  "paymentId": "<uuid>",
  "status": "POSTED|UNALLOCATED|PENDING",
  "confidence": 0.92,
  "model": "gpt-4.1-mini"
}
```

### `/payments/apply`

Headers: `Authorization: Bearer <jwt>`, `x-idempotency-key: <string>`

```json
POST /payments/apply
{
  "saccoId": "<uuid>",
  "msisdn": "+2507...",
  "amount": 20000,
  "currency": "RWF",
  "txnId": "12345",
  "occurredAt": "2025-10-01T12:00:00Z",
  "reference": "NYA.GAS.TWIZ.001",
  "sourceId": "<sms-id?>"
}
```

**Response**

```json
{
  "paymentId": "<uuid>",
  "status": "POSTED|UNALLOCATED|PENDING",
  "balances": {
    "accountId": "<uuid>",
    "balance": 420000
  },
  "idempotent": false
}
```

Duplicate requests with the same idempotency key return the cached payload and
set `idempotent: true`.

### `/recon/exceptions`

- `GET` – returns open exceptions scoped to the caller’s SACCO.
- `POST` – body must include `paymentId` and `action` (`ASSIGN`, `APPROVE`,
  `REJECT`).

```json
POST /recon/exceptions
{
  "paymentId": "<uuid>",
  "action": "ASSIGN",
  "ikiminaId": "<uuid>",
  "memberId": "<uuid?>",
  "note": "Linked after member confirmation"
}
```

**Response**

```json
{
  "paymentId": "<uuid>",
  "status": "POSTED"
}
```

### `/reports/export`

Query parameters:

- `saccoId` (optional for admins, implied for staff)
- `ikiminaId` (optional)
- `startDate`, `endDate` (ISO8601, optional – defaults to last 7 days)

Returns a CSV stream with `x-report-signature` header when `REPORT_SIGNING_KEY`
is configured.

### `/admin/reset-mfa`

System-admin only.

```json
POST /admin/reset-mfa
{
  "userId": "<uuid>",
  "reason": "Lost authenticator device on field assignment"
}
```

Resets trusted devices, revokes all MFA factors, marks
`auth.users.mfa_enabled = false`, enqueues a notification, and logs an
`MFA_RESET` audit entry.

### `/mfa-email`

Internal function invoked from Next.js API handlers. Payload:

```json
POST /mfa-email
{
  "email": "staff@sacco.rw",
  "code": "123456",
  "ttlMinutes": 10,
  "expiresAt": "2025-10-20T12:34:56Z",
  "locale": "en"
}
```

Requires `RESEND_API_KEY` and `MFA_EMAIL_FROM` secrets. On success it returns
`{ "success": true }` and increments the `mfa_email_sent` metric; failures
increment `mfa_email_failure` and bubble `send_failed`, `invalid_payload`, or
`internal_error`.

## Common behaviour

- **Supabase client** – all functions inject the service-role key via
  `createServiceClient()` (`supabase/functions/_shared/mod.ts`).
- **Rate limiting** – per-IP and per-user buckets stored in `ops.rate_limits`
  via `public.consume_route_rate_limit`.
- **Idempotency** – `/payments/apply` uses `ops.idempotency` keyed by user +
  header; subsequent calls replay the cached response.
- **Encryption** – MSISDNs and national IDs always pass through `encryptField()`
  / `hashField()` before persistence.
- **Auditing** – privileged operations produce `app.audit_logs` entries (see
  action constants in each function).

Update this file whenever new functions or behaviours ship to keep API consumers
aligned.
