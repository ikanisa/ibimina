# TapMoMo Release Checklists

The following checklists ensure TapMoMo mobile releases cover critical
telephony, NFC, and backend readiness scenarios. Complete each section prior to
publishing to app stores or promoting a web build.

## Carrier USSD & NFC Validation

- [ ] Confirm MTN Rwanda USSD flows (`*182*8*1#`) execute end-to-end on latest
      production SIMs.
- [ ] Confirm Airtel Rwanda USSD flows (`*182#` shortcut) execute end-to-end on
      live SIMs.
- [ ] Capture device logs for both carriers showing TapMoMo telemetry events
      `tapmomo_ussd_launch` and `tapmomo_ussd_response`.
- [ ] Validate fallback dial intent triggers when TelephonyManager returns
      `USSD_RETURN_FAILURE`. Attach screenshots of the manual prompt.
- [ ] Verify NFC tap handshakes (Pay and Get Paid) on reference devices (Pixel
      6, Samsung A54) using production build variants.
- [ ] Record AppCenter/Firebase dashboards showing tap attempt counts increase
      for the test window.

## Dual-SIM Behaviour & Routing

- [ ] Test USSD launch on dual-SIM Android devices with MTN in SIM 1 and Airtel
      in SIM 2, ensuring SIM selector prompts render.
- [ ] Validate fallback instructions appear when the inactive SIM is selected
      and telemetry emits `staff_ussd_manual_required`.
- [ ] Confirm TapMoMo TelephonyManager subscription overrides honour the
      selected SIM in the instrumentation build.
- [ ] Document carrier preference defaults (e.g., MTN preferred) for QA and
      attach device screenshots.
- [ ] Ensure disabling one SIM causes
      `tapmomo_nfc_unavailable`/`tapmomo_nfc_disabled` events only once per
      session.

## iOS NFC Session UX Review

- [ ] Validate iOS build shows NFC ready states (`Session Ready`,
      `Hold Near Reader`) with VoiceOver enabled.
- [ ] Confirm session timeout messaging appears after 45 seconds and links to
      manual USSD fallback instructions.
- [ ] Record telemetry from TestFlight build reaching analytics backend
      (`wallet_token_tap_attempt`).
- [ ] Verify error flows for unsupported devices (e.g., iPhone 7) trigger
      accessibility announcements and analytics events.
- [ ] Capture screen recordings for start, successful tap, and fallback flows to
      share with compliance reviewers.

## Supabase Secret Rotation & Observability

- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, and analytics
      cache tokens ahead of release.
- [ ] Run `scripts/verify-schema.sh` against staging and production projects
      with new credentials.
- [ ] Validate PostgREST policies for `nfc_tap_events` and `ussd_sessions`
      enforce least privilege after rotation.
- [ ] Update infrastructure documentation with rotation timestamps and
      responsible engineer.
- [ ] Confirm App Center/Firebase instrumentation keys stored in Supabase config
      match rotated secrets.
