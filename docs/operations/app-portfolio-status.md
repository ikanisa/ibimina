# App Portfolio Status — November 2025 Update

## Summary

Following the major repository refactoring, the Ibimina platform now consists
of only Staff Admin applications. All other applications (client, mobile,
website, platform-api, sacco-plus-client, android-auth) have been removed
as part of the streamlined focus on SACCO staff operations.

## Current Active Applications

| Application              | Package                        | Status    |
| ------------------------ | ------------------------------ | --------- |
| Staff Admin PWA          | `@ibimina/staff-admin-pwa`     | ✅ Active |
| Staff Admin Desktop      | `@ibimina/staff-admin-desktop` | ✅ Active |

## Current Active Packages

| Package                  | Status    |
| ------------------------ | --------- |
| `@ibimina/admin-core`    | ✅ Active |
| `@ibimina/config`        | ✅ Active |
| `@ibimina/flags`         | ✅ Active |
| `@ibimina/lib`           | ✅ Active |
| `@ibimina/locales`       | ✅ Active |
| `@ibimina/supabase-schemas` | ✅ Active |
| `@ibimina/ui`            | ✅ Active |

## Removed Applications

The following applications were removed during the November 2025 refactoring:

- `apps/admin` - Merged into `apps/pwa/staff-admin`
- `apps/client` - Member-facing PWA (archived)
- `apps/mobile` - Expo mobile app (archived)
- `apps/website` - Marketing website (archived)
- `apps/platform-api` - Background workers (archived)
- `apps/sacco-plus-client` - Prototype app (archived)
- `apps/android-auth` - Kotlin auth shell (archived)

## Removed Packages

The following packages were removed:

- `@ibimina/api-contracts`
- `@ibimina/data-access`
- `@ibimina/eslint-plugin-ibimina`
- `@ibimina/shared-types`
- `@ibimina/tapmomo-proto`
- `@ibimina/ui-components`
- `@ibimina/providers`
- `@ibimina/testing`
- `@ibimina/ai-agent`

## Maintenance Notes

- All documentation has been updated to reflect the current structure
- CI/CD workflows now only build and deploy Staff Admin applications
- The Supabase backend continues to serve the Staff Admin applications

## Owner

- Engineering: Development Team
- Last Updated: November 2025
