# SACCO+ Application - Release Documentation

## Overview

SACCO+ is a comprehensive digital platform designed for Umurenge SACCO
operations in Rwanda. The platform consists of multiple applications:

- **Admin Application**: Management and administrative interface
- **Client Application**: Member-facing Progressive Web App (PWA)
- **Platform API**: Backend services and business logic

## Latest Release

### Version: P3 Production Readiness Release

**Release Date**: 2025-10-28

This release includes final enhancements, accessibility improvements, and
additional features to ensure production readiness.

### Launch Resources

- [Go-Live documentation hub](go-live/README.md)
- [Release checklist](go-live/release-checklist.md)
- [Release artifacts inventory](go-live/artifacts-inventory.md)
- [Release governance & branch protection](go-live/release-governance.md)
- [CI workflows overview](CI_WORKFLOWS.md)

## Key Features

### Web Push Notifications

- VAPID-based Web Push notification system
- Topic-based subscription management
- Support for rich notifications with actions and icons
- Service worker integration for background notification handling

### Feature Flags

- Environment-variable-based feature flag system
- Easy enable/disable of experimental features
- Runtime feature toggling without code changes
- Support for gradual rollouts and A/B testing

### Accessibility (a11y)

- WCAG 2.1 AA compliance
- Comprehensive keyboard navigation support
- Proper ARIA roles and attributes
- Enhanced contrast ratios for readability
- Focus indicators for interactive elements
- Screen reader optimization

### Progressive Web App (PWA)

- Offline-first architecture
- App shell caching
- Background sync capabilities
- Install to home screen functionality
- Native app-like experience

## Deployment Instructions

### Prerequisites

- Node.js >= 18.18.0
- pnpm 10.19.0
- Supabase project (for database and authentication)

### Environment Variables

Create a `.env.local` file in each application directory based on the
`.env.example` files:

#### Client Application (`apps/client/.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Web Push Notifications
# Generate keys using: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH=true
NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES=false
NEXT_PUBLIC_FEATURE_FLAG_NEW_UI=false
```

### Installation

```bash
# Install dependencies
pnpm install

# Run linting
pnpm run lint

# Run type checking
pnpm run typecheck

# Run tests
pnpm run test

# Build all applications
pnpm run build
```

### Development

```bash
# Start development server (admin app)
pnpm run dev

# Start client app development server
pnpm --filter @ibimina/client dev

# Start platform API development server
pnpm --filter @ibimina/platform-api dev
```

### Production Build

```bash
# Build all packages and applications
pnpm run build

# Start production servers
pnpm --filter @ibimina/admin start
pnpm --filter @ibimina/client start
pnpm --filter @ibimina/platform-api start
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Supabase RLS policies verified
- [ ] VAPID keys generated and configured
- [ ] Feature flags set appropriately
- [ ] SSL/TLS certificates configured
- [ ] CDN configured for static assets
- [ ] Monitoring and logging configured
- [ ] Backup strategy implemented
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Accessibility audit passed

## API Endpoints

### Web Push Notifications

#### Subscribe to Push Notifications

```
POST /api/push/subscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "base64-encoded-key",
    "auth": "base64-encoded-key"
  },
  "topics": ["announcements", "payments"]
}
```

#### Unsubscribe from Push Notifications

```
POST /api/push/unsubscribe
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "topics": ["announcements"]  // optional - omit to unsubscribe from all
}
```

#### Get VAPID Public Key

```
GET /api/push/subscribe
```

## Configuration

### Feature Flags

Feature flags are controlled via environment variables with the
`NEXT_PUBLIC_FEATURE_FLAG_` prefix:

- `NEXT_PUBLIC_FEATURE_FLAG_WEB_PUSH`: Enable/disable web push notifications
- `NEXT_PUBLIC_FEATURE_FLAG_BETA_FEATURES`: Enable/disable beta features
- `NEXT_PUBLIC_FEATURE_FLAG_NEW_UI`: Enable/disable new UI components

See [FEATURE_FLAGS.md](./FEATURE_FLAGS.md) for detailed documentation.

### Service Worker

The application uses a custom service worker for:

- Offline caching
- Background sync
- Push notifications
- Resource optimization

Configuration is in `apps/client/workers/service-worker.ts`.

## Monitoring and Observability

### Key Metrics to Monitor

- Application uptime
- API response times
- Error rates
- Push notification delivery rates
- Service worker registration success rate
- Cache hit rates
- User engagement metrics

### Logging

All applications use structured logging. Key log events:

- Authentication events
- API errors
- Push notification events
- Feature flag evaluations

## Security

### Authentication

- Supabase Auth with JWT tokens
- Row-level security (RLS) policies
- Secure HTTP-only cookies

### Web Push Security

- VAPID protocol for server identification
- End-to-end encrypted push messages
- User consent required before subscription

### Content Security Policy

- Strict CSP headers configured
- XSS protection enabled
- Clickjacking protection via X-Frame-Options

## Support and Troubleshooting

### Common Issues

#### Push Notifications Not Working

1. Verify VAPID keys are correctly configured
2. Check browser console for service worker errors
3. Ensure HTTPS is enabled (required for push notifications)
4. Verify user has granted notification permission

#### Service Worker Not Registering

1. Check that app is served over HTTPS (or localhost)
2. Verify service worker file path is correct
3. Check browser console for registration errors
4. Clear browser cache and try again

#### Feature Flags Not Applying

1. Verify environment variables are prefixed with `NEXT_PUBLIC_`
2. Restart development server after changing .env files
3. Check that FeatureFlagProvider wraps your app
4. Verify flag names match (use kebab-case)

## Additional Resources

- [Accessibility Audit Report](./A11Y_AUDIT.md)
- [Feature Flags Documentation](./FEATURE_FLAGS.md)
- [Testing Documentation](./TESTING.md)
- [API Documentation](./API-ROUTES.md)
- [Database Schema](./DB-SCHEMA.md)

## License

Copyright © 2025 Ibimina. All rights reserved.

## Contact

For support or questions, please contact the development team.
