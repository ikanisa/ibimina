# Tooling and Best Practices Setup - Quick Start

This document provides a quick overview of the new tooling and best practices
implemented in this repository.

## What Changed?

We've added comprehensive development tooling to improve code quality,
consistency, and collaboration:

### 🎨 Code Formatting & Style

- **Prettier**: Automatic code formatting
- **ESLint**: Code quality and best practices
- **EditorConfig**: Cross-editor consistency

### 🔧 Git Workflow

- **Husky**: Git hooks management
- **Commitlint**: Enforce conventional commit messages
- **Lint-staged**: Auto-format before commits

### 📦 Dependency Management

- **Renovate**: Automated dependency updates
- **Vulnerability Scanning**: CI checks for security issues

### 📚 Documentation

- **CONTRIBUTING.md**: How to contribute
- **DEVELOPMENT.md**: Development guide
- Enhanced README and PR templates

## Quick Start

### For New Contributors

1. **Clone and install**:

   ```bash
   git clone https://github.com/ikanisa/ibimina.git
   cd ibimina
   pnpm install  # Automatically sets up git hooks
   ```

2. **Make changes** as usual - formatting happens automatically!

3. **Commit with conventional format**:
   ```bash
   git commit -m "feat(component): add new feature"
   git commit -m "fix(bug): resolve issue"
   ```

### Common Commands

```bash
# Format code
pnpm format              # Format all files
pnpm format:check        # Check formatting

# Lint code
pnpm lint                # Lint all packages

# Type check
pnpm typecheck           # Check TypeScript types

# Build & test
pnpm build               # Build all packages
pnpm test                # Run tests

# Deployment check
pnpm check:deploy        # Full readiness validation
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore,
revert

**Examples**:

```bash
feat(dashboard): add analytics chart
fix(auth): resolve login timeout
docs: update contributing guide
refactor(api): simplify payment logic
```

## What Happens on Commit?

1. **Pre-commit hook** runs automatically:
   - Formats staged files with Prettier
   - Fixes ESLint issues
   - Only processes changed files (fast!)

2. **Commit-msg hook** validates your commit message:
   - Ensures conventional format
   - Provides helpful errors if invalid

3. **If all passes**: Commit succeeds ✅
4. **If checks fail**: Fix issues and try again

## VS Code Setup (Recommended)

The repository includes VS Code settings and extension recommendations:

1. Open the project in VS Code
2. Install recommended extensions when prompted:
   - Prettier
   - ESLint
   - Tailwind CSS IntelliSense
   - EditorConfig

3. Settings are already configured:
   - Format on save ✅
   - ESLint auto-fix ✅
   - Consistent styling ✅

## Dependency Updates

Renovate bot will automatically:

- Create PRs for dependency updates
- Group updates intelligently
- Check for security vulnerabilities
- Schedule updates weekly

**Action required**: Review and merge Renovate PRs when they appear.

## Need Help?

- 📖 Read [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines
- 🛠️ Check [DEVELOPMENT.md](DEVELOPMENT.md) for development setup
- 📝 Review the README for project overview

## Benefits

✅ **Consistent code style** across the entire project ✅ **Automated
formatting** - no manual work needed ✅ **Clear commit history** - easy to
understand changes ✅ **Security scanning** - vulnerabilities caught early ✅
**Up-to-date dependencies** - automated updates ✅ **Fast onboarding** -
comprehensive documentation ✅ **Better collaboration** - standardized workflows

---

**Summary**: The tooling is now in place to ensure high code quality and smooth
collaboration. Just install, code, and commit - the tools handle the rest! 🚀
