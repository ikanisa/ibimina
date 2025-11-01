# RFC: WhatsApp Business Messaging Integration

## Status

Draft

## Authors

- Platform Squad

## Stakeholders

- Customer Success
- Support Engineering
- Compliance & Risk

## Context

Cooperative field teams have requested a conversational channel on WhatsApp to
match member expectations. We already maintain outbound notification lambdas,
but real-time inbound handling, delivery receipts, and proactive agent replies
are missing. We also need a controlled rollout plan while we validate support
capacity and regulatory guardrails for Rwanda and future expansion markets.

## Goals

- Select an API provider for two-way WhatsApp messaging with template and
  session support.
- Define the webhook handling contract implemented in
  `apps/platform-api/src/integrations/whatsapp`.
- Roll out behind `FeatureFlag.WHATSAPP_BETA` with clear activation stages and
  observability.
- Prepare for escalation to voice / IVR fallbacks with vetted vendors.

## Non-Goals

- Building a full agent console (will reuse existing admin tooling).
- Automating NLP / AI responses beyond canned acknowledgement messages.
- Shipping production IVR flows during this milestone.

## Proposed Solution

### API Provider Selection

We will adopt the **Meta WhatsApp Business Cloud API**.

| Requirement           | Meta WhatsApp Cloud API                                  | Rationale                                                    |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| Hosting               | Fully managed by Meta                                    | Avoids on-premise BSP deployments and accelerates onboarding |
| Template management   | API + Business Manager UI                                | Matches existing notification templates stored in Supabase   |
| Session messaging     | Supported (24-hour window)                               | Enables contextual replies from support within SLA           |
| Rate limits           | Scales with verified business tiers                      | Aligns with expected traffic (<10 TPS)                       |
| Pricing               | First 1000 conv./month free, tiered by conversation type | Competitive for pilot scale                                  |
| Regional availability | Global, includes Rwanda                                  | No additional aggregator needed                              |

Fallback to a local aggregator (e.g., Africa's Talking) remains a contingency if
Meta access is blocked, but current compliance feedback indicates direct access
is acceptable.

### Webhook Handling (`apps/platform-api/src/integrations/whatsapp`)

- Expose `createWhatsAppHandler` that wires:
  - Feature flag gating via `FeatureFlag.WHATSAPP_BETA`.
  - Transport adapter with `sendAutomatedReply` and `markAsRead` operations;
    actual transport will call the Meta API.
  - Structured response summarising processed inbound messages and delivery
    status updates.
- Webhook payload contract:
  - Iterate over `entry[].changes[].value.messages` for inbound content.
  - Iterate over `entry[].changes[].value.statuses` for delivery/read receipts.
  - Ignore unsupported message types (stickers, media) with logged hints for
    future support.
- Default behaviour while in beta:
  - Acknowledge every text message with a canned “thanks, an agent will follow
    up” reply.
  - Immediately mark inbound messages as read to clear the Meta UI state.
  - Surface metrics via structured logs (counts of inbound/status events)
    feeding into DataDog dashboards.
- Failure handling:
  - If feature flag disabled, exit with `403` style response without touching
    the transport layer.
  - Wrap transport invocations with retries (to be implemented when wiring the
    concrete transport) but expose hooks for backoff configuration now.

### Flag Rollout Strategy (`FeatureFlag.WHATSAPP_BETA`)

1. **Dark launch (off by default):** Merge handler with flag defaulting to
   `false`. Only synthetic monitoring exercises the webhook.
2. **Internal enablement:** Allow customer success testers by flipping the flag
   for sandbox tenants. Monitor message echo pipeline and audit logs.
3. **Limited member cohort:** Enable for 2–3 cooperatives (~500 members). Track
   SLA metrics, failure rate, and agent workload.
4. **General availability:** Once error rate <1% for two consecutive weeks,
   graduate the flag and document operational runbooks.

Feature flag plumbing:

- Define `FeatureFlag.WHATSAPP_BETA` in the shared feature flag enum so both API
  and admin UI can toggle it.
- Platform API will read flag state per tenant (via config service stub during
  spike).
- Admin console gets a toggle surfaced in the Feature Flags card (future
  enhancement).

## Security & Compliance

- Store Meta credentials (`META_WHATSAPP_ACCESS_TOKEN`,
  `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_BUSINESS_ACCOUNT_ID`) via
  existing secrets manager flow.
- Verify webhook signatures using Meta’s `X-Hub-Signature-256` header before
  invoking handlers.
- Log redaction: strip message bodies in production logs to avoid PII leakage;
  use hashed member identifiers for correlation.

## Observability

- Emit structured logs
  `{ channel: "whatsapp", inboundCount, statusCount, tenantId }`.
- Add counters for `whatsapp.inbound.messages` and `whatsapp.status.updates` in
  the telemetry pipeline.
- Configure alert when retry circuit opens more than twice in 5 minutes.

## Appendix A – Voice/IVR Vendor Feasibility Matrix

| Vendor                     | Coverage                                                         | Latency (Rwanda -> closest PoP)        | Pricing Snapshot                             | Regulatory Notes                                                        | Integration Fit                                                     |
| -------------------------- | ---------------------------------------------------------------- | -------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Twilio Voice**           | 180+ countries, incl. virtual numbers for Rwanda via partner BSP | ~210–250 ms RTT via EU (Frankfurt) PoP | ~$0.13/min inbound, $0.35/min outbound (USD) | Requires proof of business registration; Rwanda outbound subject to KYC | Direct SDK + existing Twilio account (SMS already in use)           |
| **Africa's Talking Voice** | Focused on African markets incl. Rwanda short codes              | ~90–120 ms RTT via Nairobi PoP         | ~$0.07/min inbound, $0.12/min outbound (USD) | Local regulatory filings handled by AT; easier shortcode procurement    | REST APIs; webhook pattern matches existing Supabase function model |
| **Vonage Voice API**       | Global, Rwanda coverage via SIP interconnects                    | ~200 ms RTT via EU PoP                 | ~$0.14/min inbound, $0.28/min outbound (USD) | Requires dedicated compliance review; slower onboarding                 | Webhook + JWT auth; heavier setup than needed                       |

**Latency & Cost Considerations**

- Africa's Talking offers the lowest latency/cost for Rwanda-centric IVR, but
  lacks existing organisational familiarity.
- Twilio provides continuity with current tooling and global expansion path at a
  higher per-minute rate.
- Recommended approach: pilot with Twilio (fastest integration), gather usage
  data, and revisit Africa's Talking if sustained volume justifies optimisation.
