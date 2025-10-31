# SACCO+ Website

Promotional and informational website for the SACCO+ intermediation platform.

## Overview

The SACCO+ website provides information about the digital ibimina platform for
Umurenge SACCOs in Rwanda. It serves multiple audiences:

- **Members**: How to contribute via USSD, view statements, join groups
- **SACCOs**: Staff workflows, data privacy, pilot information
- **Stakeholders**: Project objectives, timeline, contact information

## Key Features

- 🎨 Rwanda-themed design with animated gradient background
- 💎 Glass-morphism UI components
- 📱 Fully responsive design (mobile-first)
- ♿ WCAG 2.1 AA compliant
- 🖨️ Printable USSD instruction cards
- 🌍 Multilingual ready (Kinyarwanda, English, French)
- 🔍 SEO optimized with proper metadata
- 📄 Comprehensive legal pages (Terms, Privacy)

## Pages

### Public Pages

- **Home** (`/`) - Hero, features, how it works, pilot CTA
- **For Members** (`/members`) - USSD guide, reference cards, FAQ
- **For SACCOs** (`/saccos`) - Staff workflow, data privacy, sample CSV
- **Pilot: Nyamagabe** (`/pilot-nyamagabe`) - Objectives, timeline, KPIs
- **FAQ** (`/faq`) - Comprehensive Q&A for all audiences
- **Contact** (`/contact`) - Contact form and office information

### Legal Pages

- **Terms of Service** (`/legal/terms`) - Platform terms and conditions
- **Privacy Policy** (`/legal/privacy`) - Data handling and security

## Tech Stack

- **Framework**: Next.js 15.5.4 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **SEO**: next-seo
- **i18n**: next-intl (planned)

## Getting Started

### Prerequisites

- Node.js 18.18.0 or later
- pnpm 10.19.0

### Installation

From the monorepo root:

```bash
pnpm install
```

### Development

Run the development server:

```bash
pnpm --filter @ibimina/website dev
```

The website will be available at http://localhost:3002

### Building

Build for production:

```bash
pnpm --filter @ibimina/website build
```

### Linting and Type Checking

```bash
# Lint
pnpm --filter @ibimina/website lint

# Type check
pnpm --filter @ibimina/website typecheck
```

## Design System

### Colors

- **Rwanda Blue**: `#00A1DE` - Primary brand color
- **Rwanda Royal**: `#0033FF` - Gradient accent
- **Rwanda Yellow**: `#FAD201` - Call-to-action highlights
- **Rwanda Green**: `#20603D` - Success states
- **Ink**: `#0B1020` - Text and backgrounds

### Accessibility

- ✅ Semantic HTML throughout
- ✅ Proper heading hierarchy
- ✅ Keyboard navigation support
- ✅ Focus-visible states
- ✅ High contrast text (≥4.5:1)
- ✅ Large touch targets (≥48px)
- ✅ ARIA labels on interactive elements
- ✅ Reduced motion support

## License

Proprietary - SACCO+
