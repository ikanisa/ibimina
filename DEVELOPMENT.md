# Development Guide

This guide provides detailed instructions for setting up and working with the
Ibimina development environment.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Development Environment](#development-environment)
- [Project Structure](#project-structure)
- [Common Development Tasks](#common-development-tasks)
- [Tooling Overview](#tooling-overview)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

- **Node.js**: Version 18.18.0 or higher
  - Check version: `node --version`
  - Download from: https://nodejs.org/

- **pnpm**: Version 10.19.0 (managed automatically)
  - This is automatically installed via the `packageManager` field in
    package.json
  - Manual installation: `npm install -g pnpm@10.19.0`

- **Git**: Latest version recommended
  - Check version: `git --version`

### Recommended Tools

- **VS Code**: With recommended extensions
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ikanisa/ibimina.git
cd ibimina
```

### 2. Install Dependencies

```bash
pnpm install
```

This will:

- Install all project dependencies
- Set up git hooks (husky)
- Prepare the development environment

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```bash
# App Configuration
APP_ENV=development
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Git commit information
GIT_COMMIT_SHA=$(git rev-parse HEAD)
```

See `.env.example` for a complete list of available configuration options.

### 4. Verify Setup

Run the following commands to verify your setup:

```bash
# Check formatting
pnpm format:check

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run tests
pnpm test
```

## Development Environment

### Starting the Development Server

```bash
# Start the admin app
pnpm dev

# Or specify the workspace
pnpm --filter @ibimina/admin dev
```

The development server will start on http://localhost:3100

### Development Server Features

- **Hot Module Replacement (HMR)**: Changes reflect immediately
- **Error Overlay**: Detailed error messages in the browser
- **Fast Refresh**: React components update without losing state

## Project Structure

```
ibimina/
├── .github/              # GitHub workflows and configurations
├── .husky/               # Git hooks
├── apps/
│   ├── admin/            # Main admin application (Next.js)
│   ├── client/           # Client-facing application
│   └── platform-api/     # Backend API services
├── packages/
│   ├── config/           # Shared configuration utilities
│   ├── core/             # Core business logic
│   ├── testing/          # Testing utilities
│   └── ui/               # Shared UI components
├── supabase/
│   ├── functions/        # Edge functions
│   ├── migrations/       # Database migrations
│   └── tests/            # Database tests
├── docs/                 # Project documentation
├── scripts/              # Build and utility scripts
├── .prettierrc.json      # Prettier configuration
├── eslint.config.mjs     # ESLint configuration
├── commitlint.config.mjs # Commitlint configuration
├── renovate.json         # Renovate bot configuration
├── package.json          # Root package configuration
├── pnpm-workspace.yaml   # pnpm workspace definition
└── tsconfig.base.json    # Base TypeScript configuration
```

### Key Directories

- **apps/admin**: Main staff console (Next.js App Router)
  - `app/`: Next.js app directory with routes
  - `components/`: React components
  - `lib/`: Utilities and helpers
  - `providers/`: Context providers
  - `tests/`: Test files

- **packages/**: Shared code across applications
  - Organized as separate npm packages
  - Imported using workspace protocol (e.g., `@ibimina/core`)

- **supabase/**: Backend infrastructure
  - Database schema, migrations, and Edge Functions
  - Local development with Supabase CLI

## Common Development Tasks

### Working with the Monorepo

This is a pnpm workspace with multiple packages. Common patterns:

```bash
# Run command in all workspaces
pnpm -r run <command>

# Run command in specific workspace
pnpm --filter @ibimina/admin <command>

# Add dependency to specific workspace
pnpm add <package> --filter @ibimina/admin

# Add dev dependency to root
pnpm add -D -w <package>
```

### Code Quality Checks

```bash
# Format code
pnpm format                 # Format all files
pnpm format:check           # Check without modifying

# Linting
pnpm lint                   # Lint all packages

# Type checking
pnpm typecheck              # Check TypeScript types
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @ibimina/admin build

# Build with bundle analysis
ANALYZE_BUNDLE=1 pnpm build
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific test suites
pnpm --filter @ibimina/admin test:unit      # Unit tests
pnpm --filter @ibimina/admin test:auth      # Auth integration tests
pnpm --filter @ibimina/admin test:rls       # RLS policy tests
pnpm --filter @ibimina/admin test:e2e       # End-to-end tests

# Run tests in watch mode (if available)
pnpm --filter @ibimina/admin test:watch
```

### Database Operations

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Create new migration
supabase migration new <name>

# Apply migrations
supabase db push

# Refresh generated TypeScript definitions after schema changes
pnpm gen:types
```

> **Tip:** Lint and typecheck commands now fail if
> `apps/admin/lib/supabase/types.ts` is stale, so run `pnpm gen:types` whenever
> you modify the database schema.

### Git Workflow

```bash
# Create feature branch
git checkout work
git pull origin work
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat(scope): description"

# Push to remote
git push origin feature/your-feature

# Create pull request on GitHub
```

### Pre-commit Checks

Git hooks automatically run on commit:

1. **lint-staged**: Formats and lints staged files
2. **commitlint**: Validates commit message format

If checks fail, the commit is rejected. Fix the issues and try again.

### Deployment Readiness Check

Before deploying, run the full deployment check:

```bash
pnpm check:deploy
# or
make ready
```

This runs:

- Feature flag validation
- Linting
- Type checking
- Tests
- Build
- E2E tests
- Lighthouse performance checks

## Tooling Overview

### Package Manager: pnpm

- **Fast**: Uses content-addressable storage
- **Efficient**: Hard links instead of copying
- **Strict**: Prevents phantom dependencies

Learn more: https://pnpm.io/

### Linting: ESLint

Configuration: `eslint.config.mjs`

- TypeScript support
- React Hooks rules
- Prettier integration

Run: `pnpm lint`

### Formatting: Prettier

Configuration: `.prettierrc.json`

- Consistent code style
- Auto-formatting on save (in VS Code)
- Pre-commit auto-formatting

Run: `pnpm format`

### Commit Linting: commitlint

Configuration: `commitlint.config.mjs`

- Enforces Conventional Commits
- Validates commit messages via git hook
- Helps generate changelogs

### Dependency Updates: Renovate

Configuration: `renovate.json`

- Automated dependency updates
- Grouped updates (major, minor, patch)
- Security vulnerability alerts
- Scheduled update PRs

### Git Hooks: husky

Directory: `.husky/`

Hooks:

- `pre-commit`: Runs lint-staged
- `commit-msg`: Validates commit message

### Staged Files Linting: lint-staged

Configuration: In `package.json`

- Formats staged files with Prettier
- Lints staged files with ESLint
- Runs before commit

## Troubleshooting

### Common Issues

#### "Command not found: pnpm"

Install pnpm globally:

```bash
npm install -g pnpm@10.19.0
```

#### Build Errors After Pulling Changes

Clear cache and reinstall:

```bash
pnpm clean
rm -rf node_modules
pnpm install
```

#### TypeScript Errors

Restart TypeScript server in VS Code:

- Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
- Type "TypeScript: Restart TS Server"

#### Husky Hooks Not Running

Reinstall hooks:

```bash
pnpm prepare
```

#### Port Already in Use

Change the port:

```bash
PORT=3001 pnpm dev
```

Or kill the process using the port:

```bash
# macOS/Linux
lsof -ti:3100 | xargs kill -9

# Windows
netstat -ano | findstr :3100
taskkill /PID <PID> /F
```

#### Supabase Connection Issues

1. Check environment variables are set correctly
2. Verify Supabase project is running
3. Check network connectivity

### Getting Help

1. Check existing documentation in `docs/`
2. Review `CONTRIBUTING.md` for guidelines
3. Check GitHub issues for similar problems
4. Create a new issue with detailed information

## Best Practices

### Performance

- Use `pnpm` instead of `npm` or `yarn`
- Leverage Next.js image optimization
- Use React.memo() for expensive components
- Implement code splitting where appropriate

### Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Keep dependencies up to date
- Review Renovate PRs promptly

### Code Quality

- Write self-documenting code
- Add comments for complex logic
- Write tests for critical functionality
- Follow TypeScript best practices

### Git

- Write descriptive commit messages
- Keep commits atomic and focused
- Rebase feature branches on `work` regularly
- Squash commits before merging if needed

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [pnpm Documentation](https://pnpm.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Quick Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Quality
pnpm lint             # Lint code
pnpm format           # Format code
pnpm typecheck        # Type check

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Unit tests
pnpm test:e2e         # E2E tests

# Workspace
pnpm -r run <cmd>     # Run in all packages
pnpm --filter <pkg>   # Run in specific package

# Deployment
pnpm check:deploy     # Full readiness check
make ready            # Alternative command
```
