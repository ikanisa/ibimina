# Contributing to Staff Admin PWA

We welcome contributions! Please follow these guidelines.

## Code of Conduct

Be respectful and inclusive. Harassment will not be tolerated.

## How to Contribute

### Reporting Bugs

Open an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)

### Suggesting Features

Open an issue with:
- Use case and motivation
- Proposed solution
- Alternative approaches considered

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Run checks: `pnpm lint && pnpm typecheck && pnpm test`
6. Commit with conventional format: `feat(scope): description`
7. Push to your fork
8. Open a pull request

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Tests
- `chore`: Maintenance

**Examples:**
```
feat(auth): add biometric login support
fix(users): resolve pagination bug on mobile
docs(readme): add Docker setup instructions
```

### Code Style

- Run `pnpm format` before committing
- Follow TypeScript strict mode
- Add JSDoc for complex functions
- Keep components under 300 lines
- Write tests for new features

### Testing

- Unit tests: `src/__tests__/`
- E2E tests: `tests/e2e/`
- Aim for >80% coverage

### Documentation

Update relevant docs when making changes:
- README.md
- RUNBOOK.md
- CHANGELOG.md
- Code comments

## Development Setup

See [RUNBOOK.md](RUNBOOK.md) for detailed setup instructions.

## Questions?

Open a GitHub Discussion or contact maintainers.

Thank you for contributing!
