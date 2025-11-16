# Contributing to Ibimina

Thank you for your interest in contributing to Ibimina! This document provides
guidelines and best practices for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Getting Started

### Prerequisites

- Node.js >= 18.18.0
- pnpm 10.19.0 (automatically managed via `packageManager` field)
- Git

### Initial Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/ikanisa/ibimina.git
   cd ibimina
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Install git hooks:

   ```bash
   pnpm prepare
   ```

## Development Workflow

1. **Create a new branch** from the appropriate base branch (see
   [Branching Strategy](#branching-strategy))
2. **Make your changes** following the code style guidelines
3. **Test your changes** locally
4. **Commit your changes** following commit message conventions
5. **Push your branch** and create a pull request

### Common Commands

```bash
# Development
pnpm dev                  # Start development server
pnpm build                # Build for production
pnpm start                # Start production server

# Code Quality
pnpm lint                 # Run ESLint
pnpm format               # Format code with Prettier
pnpm format:check         # Check formatting without making changes
pnpm typecheck            # Run TypeScript type checking

# Testing
pnpm test                 # Run all tests
pnpm test:unit            # Run unit tests
pnpm test:e2e             # Run end-to-end tests
pnpm test:rls             # Run RLS policy tests

# Deployment Readiness
pnpm check:deploy         # Run full deployment checks
make ready                # Alternative command for deployment checks
```

## Content and Localization Workflow

Copy updates must follow the shared voice and tone agreements captured in
[`docs/content-style.md`](docs/content-style.md).

1. **Draft strings in `locales/` first.** Add English, Kinyarwanda, and future
   locale placeholders before wiring UI components. The automated
   `check-locale-coverage` script (run via `pnpm lint`) will fail if keys are
   missing.
2. **Share updates for review.** Post a short summary of copy changes in your
   pull request and tag product/content stakeholders for async approval. Link to
   the relevant rows in `docs/content-style.md` when tone guidance is important.
3. **Record approval.** Capture confirmation (Slack thread link, issue comment,
   or reviewer note) in the PR description before merge so future contributors
   understand the source of the wording.
4. **Use structured feedback components.** Render empty, error, and success
   states through the shared feedback message layer to keep icons, tone, and
   action layouts consistent.

## Branching Strategy

This project follows a two-branch model:

### Main Branches

- **`main`**: Production-ready code. This is the default branch and should
  always be stable.
- **`work`**: Integration branch for active feature development. Most PRs should
  target this branch.

### Feature Branches

Create feature branches from `work` using descriptive names:

```bash
git checkout work
git pull origin work
git checkout -b feature/descriptive-name
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

Examples:

- `feature/add-member-search`
- `fix/reconciliation-date-bug`
- `docs/update-api-guide`

## Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/)
specification.

### Format

```text
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **build**: Build system or dependency changes
- **ci**: CI/CD configuration changes
- **chore**: Other changes that don't modify src or test files
- **revert**: Revert a previous commit

### Scopes

Use scopes to indicate which package or area the change targets. The following
scopes are enforced by commitlint:

- `admin`
- `client`
- `mobile`
- `platform-api`
- `supabase`
- `docs`

Combine the scope with the type to clarify intent, for example
`feat(admin): add approvals tab`.

### Examples

```bash
# Feature
git commit -m "feat(admin): add passkey authentication support"

# Bug fix
git commit -m "fix(client): resolve incorrect balance display"

# Documentation
git commit -m "docs(docs): update local setup instructions"

# Breaking change
git commit -m "feat(platform-api): redesign authentication API

BREAKING CHANGE: authentication endpoint now requires OAuth2 token"

# Scoped packages
git commit -m "feat(admin): add approvals tab to transaction review"
git commit -m "fix(client): resolve null reference in checkout flow"
git commit -m "chore(platform-api): bump queue worker memory limits"
git commit -m "docs(docs): document lint-staged and commit scopes"
```

### Rules

- Use the imperative mood ("add" not "added" or "adds")
- Don't capitalize the first letter of the subject
- No period at the end of the subject
- Keep the subject line under 100 characters
- Separate subject from body with a blank line
- Use the body to explain what and why, not how

### Commit Validation

Commits are automatically validated using commitlint via git hooks. If your
commit message doesn't follow the conventions, the commit will be rejected with
a helpful error message.

## Code Style

### Formatting

This project uses Prettier for code formatting and ESLint for code quality.

- **Prettier**: Handles formatting (semicolons, quotes, indentation, etc.)
- **ESLint**: Enforces code quality rules and catches potential bugs

#### Configuration

- `.prettierrc.json`: Prettier configuration
- `eslint.config.mjs`: ESLint configuration (flat config format)

#### Automatic Formatting

Code is automatically formatted when you:

1. Stage files (via lint-staged pre-commit hook)
2. Run `pnpm format`

#### Manual Formatting

```bash
# Format all files
pnpm format

# Check formatting without making changes
pnpm format:check
```

### TypeScript

- Use TypeScript for all new code
- Avoid using `any` types - prefer `unknown` with type guards
- Define proper interfaces and types
- Use type inference where appropriate

### React

- Use functional components with hooks
- Follow React Hooks rules (enforced by ESLint)
- Keep components focused and single-purpose
- Use proper prop types

### File Organization

```text
apps/
  admin/              # Main application
    app/              # Next.js app directory
    components/       # React components
    lib/              # Utility functions and helpers
    providers/        # React context providers
    tests/            # Test files
packages/
  config/             # Configuration utilities
  core/               # Core business logic
  testing/            # Testing utilities
  ui/                 # Shared UI components
```

## Pull Request Process

### Before Creating a PR

1. **Sync with the base branch**:

   ```bash
   git checkout work
   git pull origin work
   git checkout your-feature-branch
   git merge work
   ```

2. **Run quality checks**:

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

3. **Ensure your branch builds**:

   ```bash
   pnpm build
   ```

### Creating a PR

1. Push your branch to GitHub:

   ```bash
   git push origin your-feature-branch
   ```

2. Create a pull request on GitHub targeting the `work` branch

3. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Screenshots for UI changes
   - Testing instructions

### PR Requirements

- All CI checks must pass
- Code must be reviewed and approved by at least one maintainer
- No merge conflicts with the base branch
- All comments must be resolved

### After PR is Merged

1. Delete your feature branch (GitHub does this automatically)
2. Pull the latest changes to your local `work` branch:

   ```bash
   git checkout work
   git pull origin work
   ```

## Testing

### Test Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test authentication and security flows
- **E2E Tests**: Test complete user workflows with Playwright
- **RLS Tests**: Test Row Level Security policies in Supabase

### Writing Tests

```typescript
// Unit test example
import { describe, it, expect } from "@jest/globals";

describe("calculateBalance", () => {
  it("should calculate correct balance", () => {
    const result = calculateBalance(100, 50);
    expect(result).toBe(150);
  });
});
```

### Running Tests

```bash
# All tests
pnpm test

# Specific test suites
pnpm test:unit
pnpm test:auth
pnpm test:rls
pnpm test:e2e
```

## Need Help?

- Review existing documentation in the `docs/` directory
- Check the README.md for project overview
- Review the ACTION_PLAN.md for project roadmap
- Ask questions in pull request comments or issues

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the project
- Show empathy towards other contributors

Thank you for contributing to Ibimina! 🚀
