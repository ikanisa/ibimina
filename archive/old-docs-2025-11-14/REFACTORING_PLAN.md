# Ibimina Repository Refactoring Plan

## 1. New Repository Structure

```
ibimina/
├── apps/                      # All application code
│   ├── pwa/                   # Progressive Web Apps
│   │   ├── staff-admin/       # Staff/Admin PWA
│   │   │   ├── src/
│   │   │   ├── public/
│   │   │   ├── package.json
│   │   │   └── tsconfig.json
│   │   └── client/            # Client PWA
│   │       ├── src/
│   │       ├── public/
│   │       ├── package.json
│   │       └── tsconfig.json
│   └── mobile/                # Native Mobile Apps
│       ├── staff-android/     # Staff/Admin Android App
│       │   ├── app/
│       │   │   └── src/
│       │   │       ├── main/
│       │   │       │   ├── java/com/ibimina/staff/
│       │   │       │   └── res/
│       │   ├── gradle/
│       │   ├── build.gradle.kts
│       │   └── settings.gradle.kts
│       └── client-native/     # Client iOS/Android App
│           ├── android/
│           │   ├── app/
│           │   ├── gradle/
│           │   └── build.gradle.kts
│           ├── ios/
│           │   ├── IbiminaClient/
│           │   └── IbiminaClient.xcodeproj/
│           └── shared/        # Shared mobile code
├── packages/                  # Shared packages/libraries
│   ├── shared-types/          # TypeScript types/interfaces
│   ├── supabase-client/       # Supabase configuration
│   ├── api-client/            # API client library
│   └── ui-components/         # Shared UI components for PWAs
├── backend/                   # Backend services
│   ├── supabase/
│   │   ├── migrations/        # Database migrations
│   │   ├── functions/         # Edge functions
│   │   └── seed/              # Seed data
│   └── services/
│       ├── momo-parser/       # MOMO SMS parsing service
│       └── openai-integration/# OpenAI API integration
├── scripts/                   # Build and deployment scripts
├── docs/                      # Documentation
└── .github/                   # GitHub Actions workflows
```

## 2. Step-by-Step Refactoring Process

### Phase 1: Backup and Preparation (Day 1)

1. Create a full backup branch: `pre-refactor-backup`
2. Document all current Capacitor-related issues
3. List all mobile-specific dependencies to be removed

### Phase 2: Remove Capacitor and Mobile Dependencies (Day 2-3)

#### Dependencies to Remove

```json
{
  "dependencies-to-remove": [
    "@capacitor/core",
    "@capacitor/ios",
    "@capacitor/android",
    "@capacitor/app",
    "@capacitor/haptics",
    "@capacitor/keyboard",
    "@capacitor/status-bar",
    "@capacitor/camera",
    "@capacitor/filesystem",
    "@capacitor/geolocation",
    "@capacitor/push-notifications",
    "@capacitor/share",
    "@capacitor/splash-screen",
    "@ionic/react",
    "@ionic/react-router",
    "ionicons"
  ]
}
```

#### Files/Folders to Remove

```
/capacitor.config.ts
/ios/ (if exists)
/android/ (if exists)
/capacitor.config.json
Any Capacitor-specific components in /src/components/
```

### Phase 3: Reorganize Existing Code (Day 4-5)

#### Create Monorepo Structure

```bash
# Install workspace management tools
npm install -g lerna
npm install -g nx

# Initialize workspace
npx create-nx-workspace@latest --preset=apps
```

#### Move Existing PWA Code

- Move current PWA code to `apps/pwa/staff-admin/`
- Extract client-specific features to `apps/pwa/client/`
- Create shared packages in `packages/`

### Phase 4: Set Up Native Mobile Apps (Day 6-8)

#### Staff Android App Structure

```kotlin
// apps/mobile/staff-android/app/src/main/java/com/ibimina/staff/MainActivity.kt
package com.ibimina.staff

import android.os.Bundle
import androidx.activity.ComponentActivity

class MainActivity : ComponentActivity() {
    // QR Scanner implementation
    // MOMO SMS listener
    // Supabase integration
}
```

#### Client Native App (React Native or Flutter recommended)

```tsx
// apps/mobile/client-native/src/App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  // Main app structure
}
```

## 3. Package Configuration

### Root `package.json`

```json
{
  "name": "ibimina",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev:pwa:staff": "npm run dev --workspace=apps/pwa/staff-admin",
    "dev:pwa:client": "npm run dev --workspace=apps/pwa/client",
    "build:pwa": "npm run build --workspace=apps/pwa/staff-admin && npm run build --workspace=apps/pwa/client",
    "build:android:staff": "cd apps/mobile/staff-android && ./gradlew assembleRelease",
    "build:mobile:client": "cd apps/mobile/client-native && npm run build"
  }
}
```

### Shared Supabase Client Package

```ts
// packages/supabase-client/src/index.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export * from "./types";
export * from "./hooks";
```

## 4. Staff Android App Features

### Core Features

- MOMO SMS Parser
  - SMS permission handler
  - Real-time SMS listener
  - Parse transaction details
  - Send to Supabase via API
- QR Code Authentication
  - In-app QR scanner
  - Generate session tokens
  - Authenticate PWA sessions
- OpenAI Integration
  - Process SMS content
  - Extract structured data
  - Handle edge cases

### Implementation

```kotlin
// apps/mobile/staff-android/app/src/main/java/com/ibimina/staff/services/MomoSmsService.kt
class MomoSmsService : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // SMS processing logic
        // OpenAI API call
        // Supabase update
    }
}
```

## 5. Client Mobile App Architecture

### Technology Stack

- React Native (recommended for cross-platform)
- Native Base or React Native Elements for UI
- React Navigation for routing
- Supabase JS Client for backend

### Core Features

- User authentication
- Transaction history
- Payment initiation
- Profile management
- Notifications
- Offline support

### Folder Structure

```
client-native/
├── src/
│   ├── screens/
│   ├── components/
│   ├── navigation/
│   ├── services/
│   ├── store/
│   └── utils/
├── android/
├── ios/
└── package.json
```

## 6. CI/CD Pipeline Configuration

```yaml
# .github/workflows/build-deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main, develop]

jobs:
  build-pwas:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build PWAs
        run: |
          npm install
          npm run build:pwa

  build-android-staff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Staff Android
        run: |
          cd apps/mobile/staff-android
          ./gradlew assembleRelease

  build-client-mobile:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Client Apps
        run: |
          cd apps/mobile/client-native
          npm install
          npm run build:ios
          npm run build:android
```

## 7. Migration Checklist

### Week 1

- Backup current repository
- Remove Capacitor dependencies
- Clean up mobile-specific code
- Set up monorepo structure
- Move PWA code to new structure

### Week 2

- Initialize native Android project for staff
- Implement MOMO SMS parser
- Set up QR scanner
- Integrate OpenAI API
- Test staff Android app

### Week 3

- Initialize React Native for client app
- Implement core client features
- Set up navigation
- Integrate with Supabase
- Test on iOS and Android

### Week 4

- Set up CI/CD pipelines
- Configure deployment
- Performance optimization
- Security audit
- Documentation

## 8. Clean-up Commands

```bash
# Remove Capacitor completely
npm uninstall @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
rm -rf ios android capacitor.config.*

# Remove Ionic if used
npm uninstall @ionic/react @ionic/react-router ionicons

# Clean npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 9. New Development Workflow

### For PWA Development

```bash
# Staff/Admin PWA
cd apps/pwa/staff-admin
npm run dev

# Client PWA
cd apps/pwa/client
npm run dev
```

### For Mobile Development

```bash
# Staff Android
cd apps/mobile/staff-android
./gradlew installDebug

# Client Mobile
cd apps/mobile/client-native
npm run ios  # for iOS
npm run android  # for Android
```

## 10. Shared Components Strategy

### Shared TypeScript Types

```ts
// packages/shared-types/src/index.ts
export interface User {
  id: string;
  email: string;
  role: "admin" | "staff" | "client";
}

export interface Transaction {
  id: string;
  amount: number;
  type: "momo" | "bank";
  status: "pending" | "completed" | "failed";
}
```

### Shared API Client

```ts
// packages/api-client/src/index.ts
export class IbiminaAPI {
  constructor(private supabase: SupabaseClient) {}

  async getTransactions() {
    return this.supabase.from("transactions").select("*");
  }
}
```

## 11. Environment Configuration

### Environment Variables Structure

```bash
# .env.local (PWA)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=

# Staff Android (.env)
SUPABASE_URL=
SUPABASE_KEY=
OPENAI_API_KEY=

# Client Mobile (.env)
SUPABASE_URL=
SUPABASE_KEY=
API_BASE_URL=
```

## 12. Post-Refactoring Benefits

1. Clean Separation: Each app has its own dedicated space
2. No Conflicts: Removed Capacitor eliminates build issues
3. Better Performance: Native apps for mobile, optimized PWAs for web
4. Easier Maintenance: Clear structure makes updates simpler
5. Scalability: Easy to add new apps or services
6. CI/CD Ready: Automated builds and deployments

---

This comprehensive refactoring plan will:

1. **Remove all Capacitor-related conflicts** by completely eliminating it from
   the codebase
2. **Create a clean monorepo structure** with clear separation between PWAs and
   native apps
3. **Establish dedicated native mobile apps**:
   - Staff Android app with MOMO SMS parsing and QR authentication
   - Client cross-platform app for iOS and Android
4. **Share common code efficiently** through packages
5. **Maintain a single Supabase database** while having separate frontends

The plan includes detailed file structures, implementation examples, migration
steps, and cleanup commands. This approach will resolve current build issues and
provide a scalable foundation for future development.
