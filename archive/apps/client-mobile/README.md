# Ibimina Client Mobile App

> Minimalist, Revolut-inspired SACCO mobile banking app for Rwandan clients

## ✨ Features

### 🔐 Authentication

- WhatsApp OTP authentication
- Biometric authentication (Face ID / Touch ID)
- Browse mode (explore without signing in)
- Secure session management

### 💰 Core Features

- **Accounts**: View balances, transaction history
- **Transactions**: Deposit, withdraw, transfer money
- **Loans**: Apply for loans, view loan details, repayment schedules
- **Groups (Ikimina)**: Join groups, contribute, view group activities
- **Profile**: Manage profile, settings, documents

### 🚀 Advanced Features

- **Offline Support**: Works without internet, syncs when online
- **Push Notifications**: Transaction alerts, loan updates
- **Deep Linking**: Open specific screens from notifications/links
- **NFC Payments**: TapMoMo for contactless payments (future)
- **Mobile Money**: MTN, Airtel integration

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State**: Zustand
- **Backend**: Supabase
- **Auth**: WhatsApp Business API + Supabase Auth
- **Notifications**: Expo Notifications

## 📱 Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Expo CLI
- iOS Simulator or Android Emulator

### Installation

```bash
cd apps/client-mobile
pnpm install
```

### Environment Variables

Create `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_WHATSAPP_PHONE_ID=your-phone-id
EXPO_PUBLIC_WHATSAPP_ACCESS_TOKEN=your-access-token
```

### Development

```bash
pnpm start      # Start Metro bundler
pnpm ios        # Run on iOS
pnpm android    # Run on Android
```

## 📦 Building

See [PRODUCTION_BUILD.md](./PRODUCTION_BUILD.md) for details.

```bash
pnpm build:android:production
pnpm build:ios:production
```

## 🔗 Deep Linking

Supported URLs:

- `ibimina://home`
- `ibimina://loans/:id`
- `ibimina://groups/:id/contribute`
- `https://app.ibimina.rw/...`

## 🔔 Push Notifications

Automatic setup after user signs in. Handles:

- Transaction alerts
- Loan reminders
- Group activity updates

## 🧪 Testing

```bash
pnpm test              # Run tests
pnpm lint              # Lint code
pnpm typecheck         # Type check
```

## 📚 Documentation

- [Production Build Guide](./PRODUCTION_BUILD.md)
- [Deep Linking](./README.md#-deep-linking)
- [Push Notifications](./README.md#-push-notifications)

## 🤝 Support

- Email: support@ibimina.rw
- Docs: https://docs.ibimina.rw

---

Built with ❤️ for Rwandan SACCOs
