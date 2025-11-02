# App Portfolio Status — December 2024 Review

## Summary

Stakeholder feedback confirms that only the Admin, Client, Mobile, Platform API,
and Website applications remain on the active roadmap. The Expo prototype in
`apps/sacco-plus-client` and the Kotlin authentication shell in
`apps/android-auth` are no longer required for current deployments.

- `apps/sacco-plus-client` served as the initial SACCO+ prototype. The active
  mobile rollout now ships from `apps/mobile`, so the prototype can be archived
  after final asset export.
- `apps/android-auth` was superseded by the production-ready Capacitor bundle in
  `apps/admin` (`capacitor` folder). All device-auth milestones tracked in
  `STAFF_ANDROID_APP_COMPLETE.md` have moved to the unified mobile codebase.

## Next Actions

1. **Archive repositories:** Move both app directories into an `archived/`
   workspace once delivery sign-off is completed. Update `pnpm-workspace.yaml`
   to exclude archived packages and reduce install time.
2. **Retain documentation:** Keep `STAFF_ANDROID_APP_COMPLETE.md` and
   `apps/sacco-plus-client/README.md` for historical context, but annotate that
   the implementations are frozen.
3. **Communicate change:** Notify the mobile and operations squads during the
   weekly release stand-up so any local clones can drop the archived apps.
4. **Monitor CI footprint:** After archival, validate that `pnpm install` and
   Expo caches shrink accordingly.

## Owner

- Product: ✉️ Pauline I., Director of Member Experience
- Engineering: ✉️ David N., Mobile Platform Lead
- Timeline: Archive windows scheduled for the first sprint of Q1 FY2025.
