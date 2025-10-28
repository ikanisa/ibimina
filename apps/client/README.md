# SACCO+ Client App

Mobile-first web application for Umurenge SACCO members, available as both a web
app and native Android app.

## Overview

The Client App provides member-facing features including:

- Member onboarding with WhatsApp and Mobile Money registration
- Identity document upload with OCR processing (stub)
- Mobile banking services access
- Group savings (Ikimina) management

## Platform Support

- **Web**: Progressive Web App (PWA) with offline support
- **Android**: Native Android app via Capacitor (APK)
- **iOS**: PWA installable via Safari (future: native app)

For instructions on building the Android APK, see
**[APK_BUILD_GUIDE.md](./APK_BUILD_GUIDE.md)**.

## Getting Started

### Prerequisites

- Node.js 18.18.0 or later
- pnpm 10.19.0
- Supabase account and project

### Installation

1. Install dependencies from the monorepo root:

   ```bash
   cd /path/to/ibimina
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cd apps/client
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your Supabase credentials.

### Development

Run the development server:

```bash
pnpm --filter @ibimina/client dev
```

The app will be available at http://localhost:3001

### Building

Build for production:

```bash
pnpm --filter @ibimina/client build
```

### Linting and Type Checking

```bash
# Lint
pnpm --filter @ibimina/client lint

# Type check
pnpm --filter @ibimina/client typecheck
```

## Project Structure

```
apps/client/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Auth-related pages
│   │   ├── welcome/         # Welcome page for new users
│   │   └── onboard/         # Onboarding form page
│   ├── api/                 # API routes
│   │   ├── onboard/         # Onboarding endpoint
│   │   └── ocr/upload/      # OCR upload endpoint (stub)
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   └── onboarding/          # Onboarding-related components
├── lib/                     # Utility libraries
│   ├── api/                 # API client wrappers
│   │   ├── onboard.ts       # Onboarding API
│   │   └── ocr.ts           # OCR API
│   └── supabase/            # Supabase client setup
│       ├── client.tsx       # Browser client
│       ├── server.ts        # Server client
│       ├── config.ts        # Configuration
│       └── types.ts         # Database types
└── package.json
```

## Features

### Onboarding Flow

1. **Welcome Page** (`/welcome`)
   - Introduction to SACCO+ services
   - Call-to-action to start onboarding
   - WCAG 2.1 AA accessible

2. **Onboarding Form** (`/onboard`)
   - WhatsApp number input
   - Mobile Money number input
   - Client-side validation
   - Server-side data persistence

### OCR Upload (Stub)

The OCR upload feature is currently a stub implementation that returns mocked
data. To integrate a real OCR service:

1. Update `/app/api/ocr/upload/route.ts`
2. Integrate with OCR provider (Google Vision, AWS Textract, etc.)
3. Implement file storage (Supabase Storage, S3, etc.)
4. Update `members_app_profiles.ocr_json` with real data

## Accessibility

All pages and components follow WCAG 2.1 Level AA standards:

- Semantic HTML structure
- Proper heading hierarchy
- Keyboard navigation support
- Focus-visible states on interactive elements
- High contrast text (minimum 4.5:1 ratio)
- ARIA labels where needed
- Reduced motion support

## Database Schema

The app uses the `members_app_profiles` table:

```sql
CREATE TABLE public.members_app_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_msisdn TEXT NOT NULL,
  momo_msisdn TEXT NOT NULL,
  id_type public.member_id_type,
  id_number TEXT,
  id_files JSONB,
  ocr_json JSONB,
  lang TEXT DEFAULT 'en',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Row Level Security (RLS) policies ensure users can only access their own data.

## API Endpoints

### POST /api/onboard

Creates a member profile with contact information.

**Request:**

```json
{
  "whatsapp_msisdn": "+250788123456",
  "momo_msisdn": "+250788654321",
  "lang": "en"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user_id": "...",
    "whatsapp_msisdn": "+250788123456",
    "momo_msisdn": "+250788654321",
    "lang": "en",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

### POST /api/ocr/upload

Uploads identity document for OCR processing (stub).

**Request:** multipart/form-data

- `file`: Image file (JPEG, PNG, WebP)
- `id_type`: "NID" | "DL" | "PASSPORT"

**Response (200):**

```json
{
  "success": true,
  "stub": true,
  "data": {
    "id_type": "NID",
    "id_number": "...",
    "full_name": "...",
    "date_of_birth": "...",
    "confidence": 0.95,
    "extracted_fields": {...}
  }
}
```

## Contributing

- Follow existing code patterns and naming conventions
- Ensure all new features are accessible (WCAG 2.1 AA)
- Add comprehensive documentation and comments
- Test thoroughly before committing

## License

Proprietary - SACCO+
