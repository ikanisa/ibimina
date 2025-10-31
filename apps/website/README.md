# Ibimina Website

Marketing and promotional website for the Ibimina SACCO management platform.

## Overview

This is a static Next.js website that provides information about the Ibimina
platform, its features, and contact information for potential customers.

## Key Features

- **Static Site**: Built with Next.js static export for optimal performance
- **SEO Optimized**: Comprehensive meta tags, Open Graph, and Twitter Card
  support
- **Responsive Design**: Mobile-first design that works on all devices
- **Cloudflare Ready**: Configured for deployment to Cloudflare Pages

## Pages

- **Home** (`/`) - Hero section, features overview, and CTA
- **Features** (`/features`) - Detailed list of platform capabilities
- **About** (`/about`) - Information about the platform and mission
- **Contact** (`/contact`) - Contact form and information
- **Privacy** (`/privacy`) - Privacy policy
- **Terms** (`/terms`) - Terms of service

## Tech Stack

- **Framework**: Next.js 15 (App Router with static export)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Icons**: lucide-react
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18.18.0 or later
- pnpm 10.19.0

### Installation

1. Install dependencies from the monorepo root:

   ```bash
   cd /path/to/ibimina
   pnpm install
   ```

### Development

Run the development server:

```bash
pnpm --filter @ibimina/website dev
```

The website will be available at http://localhost:3002

### Building

Build for production (static export):

```bash
pnpm --filter @ibimina/website build
```

The static files will be in the `out/` directory.

### Linting and Type Checking

```bash
# Lint
pnpm --filter @ibimina/website lint

# Type check
pnpm --filter @ibimina/website typecheck
```

## Project Structure

```
apps/website/
├── app/                    # Next.js 15 App Router pages
│   ├── features/          # Features page
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components (future)
├── public/                # Static assets
│   └── images/           # Image assets
├── next.config.mjs       # Next.js configuration
├── tailwind.config.ts    # Tailwind configuration
├── postcss.config.mjs    # PostCSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Deployment

### Cloudflare Pages

The website is configured for deployment to Cloudflare Pages:

1. Build the static export:

   ```bash
   pnpm --filter @ibimina/website build
   ```

2. Deploy the `out/` directory to Cloudflare Pages using the Cloudflare
   dashboard or CLI.

Using Cloudflare CLI (wrangler):

```bash
cd apps/website
wrangler pages deploy out
```

Or connect via Cloudflare dashboard:

- Build command: `pnpm --filter @ibimina/website build`
- Build output directory: `out`

## SEO Configuration

The website includes comprehensive SEO configuration:

- Meta tags for title, description, and keywords
- Open Graph tags for social media sharing
- Twitter Card tags
- Structured data (future enhancement)
- Sitemap generation (future enhancement)

## Future Enhancements

- [ ] Add blog/news section
- [ ] Implement contact form backend
- [ ] Add client testimonials
- [ ] Create case studies section
- [ ] Add multilingual support (Kinyarwanda, French)
- [ ] Implement newsletter signup
- [ ] Add Google Analytics or privacy-friendly alternative

## Contributing

- Follow existing code patterns and naming conventions
- Ensure all new features are accessible (WCAG 2.1 AA)
- Test thoroughly before committing
- Keep the design consistent with the brand

## License

Proprietary - SACCO+
