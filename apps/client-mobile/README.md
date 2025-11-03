# Ibimina Client Mobile App

Minimalist React Native app for SACCO members, inspired by Revolut's clean design.

## Features
- 🔐 Secure authentication with Supabase
- 💰 Account management and balance tracking
- 👥 Group savings (Ikimina) management
- 💳 Loan applications and tracking
- 📱 Offline-first with local caching
- 🌍 Multi-language support (EN/RW)

## Tech Stack
- React Native 0.76
- TypeScript 5.6
- Supabase (Auth + Database)
- Zustand (State management)
- React Navigation 6

## Setup

\`\`\`bash
# Install dependencies
npm install
# or
pnpm install

# iOS setup
cd ios && pod install && cd ..

# Run on Android
npm run android

# Run on iOS
npm run ios
\`\`\`

## Environment Variables

Copy `.env.example` to `.env` and configure:

\`\`\`
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
\`\`\`

## Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── screens/        # App screens
├── navigation/     # Navigation configuration
├── services/       # API services (Supabase)
├── store/          # State management (Zustand)
├── theme/          # Design system
├── types/          # TypeScript types
└── utils/          # Utility functions
\`\`\`

## Development

- \`npm start\` - Start Metro bundler
- \`npm run android\` - Run on Android
- \`npm run ios\` - Run on iOS
- \`npm test\` - Run tests
- \`npm run lint\` - Lint code
- \`npm run type-check\` - Type check

## Deployment

### Android
\`\`\`bash
cd android
./gradlew assembleRelease
\`\`\`

### iOS
Open \`ios/Ibimina.xcworkspace\` in Xcode and archive for distribution.

## License
Proprietary - Ibimina SACCO Platform
