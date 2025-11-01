# Ibimina Mobile App

React Native mobile app for Ibimina SACCO platform, built with Expo.

## Features

- **Rwanda-inspired Design System**: Custom theme with national colors, warm accents, and glassmorphism
- **Bottom Tab Navigation**: Home, Pay, Statements, Offers, Profile
- **Internationalization**: Support for Kinyarwanda, English, and French
- **State Management**: Zustand for global state, React Query for data fetching
- **Analytics & Monitoring**: Sentry for error tracking, PostHog for analytics
- **Feature Flags**: ConfigCat integration for gradual rollouts
- **Deep Linking**: Support for app navigation via URLs

## Tech Stack

- **Framework**: Expo ~52.0.0, React Native 0.76.5
- **Navigation**: Expo Router 4.0 with React Navigation
- **Styling**: NativeWind 4.0 (Tailwind for React Native)
- **Animations**: Reanimated 3.16, Gesture Handler 2.20
- **Data**: React Query 5.17, Zustand 4.4
- **i18n**: react-intl 6.5
- **Analytics**: Sentry 6.2, PostHog 3.1
- **Feature Flags**: ConfigCat 4.1

## Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Bottom tab navigation
│   │   ├── home.tsx       # Dashboard
│   │   ├── pay.tsx        # Payments
│   │   ├── statements.tsx # Transaction history
│   │   ├── offers.tsx     # Promotions
│   │   └── profile.tsx    # User profile
│   ├── _layout.tsx        # Root layout with providers
│   └── index.tsx          # Entry redirect
├── src/
│   ├── theme/             # Design tokens (colors, typography, spacing)
│   ├── components/        # Reusable components
│   │   └── shared/        # HeaderGradient, FloatingAskToJoinFab, LocaleToggle
│   ├── providers/         # React Query, Zustand, i18n providers
│   ├── lib/               # Sentry, PostHog, deep linking, feature flags
│   ├── mocks/             # Mock data fixtures for development
│   └── app.tsx            # Global providers wrapper
├── app.config.ts          # Expo configuration
├── tailwind.config.js     # NativeWind/Tailwind configuration
├── babel.config.js        # Babel configuration
└── package.json           # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 20+ (specified in root .nvmrc)
- pnpm 9.12.3+ (monorepo package manager)
- Expo CLI

### Installation

From the repository root:

```bash
# Install dependencies
pnpm install

# Navigate to mobile app
cd apps/mobile

# Start development server
pnpm start
```

### Development

```bash
# Start Expo dev server
pnpm start

# Run on iOS simulator
pnpm ios

# Run on Android emulator
pnpm android

# Run on web
pnpm web

# Type check
pnpm typecheck
```

## Environment Variables

Configure in `.env` or Expo environment:

```bash
# Sentry (optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=ibimina
SENTRY_PROJECT=mobile

# PostHog (optional)
POSTHOG_API_KEY=your-posthog-key
POSTHOG_HOST=https://app.posthog.com

# ConfigCat (optional)
CONFIGCAT_SDK_KEY=your-configcat-key

# Supabase (if using real backend)
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# EAS (for builds)
EAS_PROJECT_ID=your-eas-project-id
```

## Design System

### Colors

- **Rwanda Colors**: Blue (#00A1DE), Yellow (#FAD201), Green (#20603D)
- **Warm Accents**: 50-900 scale from #FFF9F5 to #9A3A0D
- **Dark Gradients**: Ink scale from #E8EAF0 to #020308

### Gradients

- **Kigali**: Horizontal Rwanda flag sweep (135deg)
- **Nyungwe**: Radial sunset effect
- **Dark Base**: Dark gradient for screens (180deg)

### Typography

- System font stack for native performance
- Scale: xs (12px) to 5xl (48px)
- Weights: regular (400), medium (500), semibold (600), bold (700)

### Elevation

- 5-level shadow system for depth
- Glassmorphism utilities (light, medium, dark)

## Mock Data

Development uses mock JSON fixtures in `src/mocks/`:

- User profile
- Groups and SACCOs
- Transactions
- Statements
- Offers
- Notifications

## Deep Linking

Supported URL schemes:

- `ibimina://`
- `https://app.ibimina.rw`

Routes:

- `ibimina://home` - Home screen
- `ibimina://pay` - Payment screen
- `ibimina://group/:id` - Group details
- `ibimina://payment/:groupId` - Make payment

## Analytics Events

Track with PostHog:

- Screen views (automatic)
- Payment initiated
- Group joined
- Offer viewed

## Feature Flags

Check flags via ConfigCat:

```typescript
import { isFeatureFlagEnabled } from "./src/lib/featureFlags";

const enabled = await isFeatureFlagEnabled("new-payment-flow", userId);
```

## Building

### EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Testing

```bash
# Type check
pnpm typecheck

# Run tests (when added)
pnpm test
```

## Deployment

Deployments are managed through EAS:

1. Update version in `app.config.ts`
2. Build: `eas build --platform all`
3. Submit: `eas submit --platform all`

## Contributing

See root `CONTRIBUTING.md` for guidelines.

## License

Proprietary - Ibimina SACCO Platform
