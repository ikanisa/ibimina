# Documentation Index

This directory contains comprehensive documentation for the ibimina project.

## 🚀 Getting Started

New to the project? Start here:

1. [**QUICK_REFERENCE.md**](QUICK_REFERENCE.md) - Quick command reference and
   deployment guide
2. [**GROUND_RULES.md**](GROUND_RULES.md) - Mandatory standards you must follow
3. [**PROJECT_STRUCTURE.md**](PROJECT_STRUCTURE.md) - Understand the codebase
   layout

## 📚 Core Documentation

### Development

- [**GROUND_RULES.md**](GROUND_RULES.md) - Mandatory best practices and
  standards
  - Package manager requirements
  - Security ground rules
  - Structured logging
  - Feature flags
  - Database standards
  - API design
  - Testing requirements

- [**PROJECT_STRUCTURE.md**](PROJECT_STRUCTURE.md) - Project structure and
  architecture
  - Repository overview
  - Application descriptions
  - Shared packages
  - Dependency graph
  - Build order

- [**TROUBLESHOOTING.md**](TROUBLESHOOTING.md) - Common issues and solutions
  - Build issues
  - Authentication issues
  - Database issues
  - Testing issues
  - Performance issues
  - Development issues

### Operations

- [**QUICK_REFERENCE.md**](QUICK_REFERENCE.md) - Quick command reference
  - Essential commands with expected timings
  - Deployment procedures
  - Environment variables
  - Emergency procedures

- [**CI_WORKFLOWS.md**](CI_WORKFLOWS.md) - CI/CD workflows documentation
  - Workflow descriptions
  - Common failure modes
  - Troubleshooting steps
  - Performance benchmarks

- [**DB_GUIDE.md**](DB_GUIDE.md) - Database procedures and guidelines
  - Migration standards
  - RLS policies
  - Database functions
  - Testing procedures

- [**ENV_VARIABLES.md**](ENV_VARIABLES.md) - Environment variables reference
  - Complete variable listing
  - Public vs server-side
  - Security levels
  - Validation procedures
  - Secret rotation

### Deployment & Production

- [**docs/go-live/README.md**](../docs/go-live/README.md) - Go-live
  documentation hub
- [**docs/go-live/release-checklist.md**](../docs/go-live/release-checklist.md) -
  Structured release flow
- [**docs/go-live/artifacts-inventory.md**](../docs/go-live/artifacts-inventory.md) -
  Evidence catalog
- [**docs/go-live/release-governance.md**](../docs/go-live/release-governance.md) -
  Branch protection and reviewer expectations
- [**docs/go-live/production-checklist.md**](../docs/go-live/production-checklist.md) -
  Comprehensive pre-deployment checklist
- [**DEPLOYMENT_CHECKLIST.md**](../DEPLOYMENT_CHECKLIST.md) - Standard release
  procedures
- [**POST_DEPLOYMENT_VALIDATION.md**](POST_DEPLOYMENT_VALIDATION.md) -
  Post-deploy verification
- [**DISASTER_RECOVERY.md**](DISASTER_RECOVERY.md) - Emergency procedures
- [**SECURITY_HARDENING.md**](SECURITY_HARDENING.md) - Security configuration
- [**go-live/supabase-go-live-checklist.md**](go-live/supabase-go-live-checklist.md) -
  Supabase-specific setup

### Architecture & Design

- [**DB-SCHEMA.md**](DB-SCHEMA.md) - Database schema documentation
- [**RLS.md**](RLS.md) - Row Level Security policies
- [**API-ROUTES.md**](API-ROUTES.md) - API routes documentation
- [**AUTH-SETUP.md**](AUTH-SETUP.md) - Authentication setup
- [**FEATURE_FLAGS.md**](FEATURE_FLAGS.md) - Feature flag system

### Testing

- [**TESTING.md**](TESTING.md) - Testing strategy and guides
- [**MOBILE_TESTING_GUIDE.md**](../MOBILE_TESTING_GUIDE.md) - Mobile testing
  procedures

### Infrastructure

- [**SMS_GATEWAY_SETUP.md**](SMS_GATEWAY_SETUP.md) - SMS gateway configuration
- [**TWA_CONFIGURATION.md**](TWA_CONFIGURATION.md) - Trusted Web Activity setup
- [**local-hosting.md**](local-hosting.md) - Local hosting guide
- [**local-caddy-cloudflare-tunnel.md**](local-caddy-cloudflare-tunnel.md) -
  Caddy + Cloudflare setup

### Operations & Monitoring

- [**OPERATIONAL_READINESS.md**](OPERATIONAL_READINESS.md) - Operational
  readiness checklist
- [**operations-runbook.md**](operations-runbook.md) - Legacy log forwarding
  guide (superseded by `docs/runbooks/OPERATIONS.md`)
- [**security-observability.md**](security-observability.md) - Security and
  observability
- [**supabase-cicd.md**](supabase-cicd.md) - Supabase CI/CD
- [**operations/app-portfolio-status.md**](operations/app-portfolio-status.md) -
  Application retention decisions and archival checklist

### Runbooks

- [**runbooks/ARCHITECTURE.md**](runbooks/ARCHITECTURE.md) - System boundaries
  and data flow overview
- [**runbooks/OPERATIONS.md**](runbooks/OPERATIONS.md) - Daily operations,
  release process, and incident response
- [**runbooks/SECURITY.md**](runbooks/SECURITY.md) - Identity, secrets, and
  rotation procedures
- [**runbooks/MOBILE_RELEASE.md**](runbooks/MOBILE_RELEASE.md) - Expo/EAS mobile
  shipping checklist
- [**runbooks/WEB_PWA_CHECKLIST.md**](runbooks/WEB_PWA_CHECKLIST.md) - Staff &
  member PWA ship gate
- [**runbooks/API_CONTRACT.md**](runbooks/API_CONTRACT.md) - REST API contract

## 📦 Package Documentation

- [**packages/README.md**](../packages/README.md) - Shared packages guide
  - Package overview
  - Build order
  - Development workflow
  - Security requirements

## 🔍 Finding Information

### By Topic

| Topic                 | Document                                                                        |
| --------------------- | ------------------------------------------------------------------------------- |
| **Standards & Rules** | [GROUND_RULES.md](GROUND_RULES.md)                                              |
| **Quick Commands**    | [QUICK_REFERENCE.md](QUICK_REFERENCE.md)                                        |
| **Project Layout**    | [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)                                    |
| **Common Problems**   | [TROUBLESHOOTING.md](TROUBLESHOOTING.md)                                        |
| **CI/CD**             | [CI_WORKFLOWS.md](CI_WORKFLOWS.md)                                              |
| **Database**          | [DB_GUIDE.md](DB_GUIDE.md)                                                      |
| **Environment**       | [ENV_VARIABLES.md](ENV_VARIABLES.md)                                            |
| **Security**          | [SECURITY_HARDENING.md](SECURITY_HARDENING.md)                                  |
| **Testing**           | [TESTING.md](TESTING.md)                                                        |
| **Deployment**        | [docs/go-live/production-checklist.md](../docs/go-live/production-checklist.md) |
| **Emergency**         | [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md)                                    |

### By Role

#### New Developer

1. [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Get oriented
2. [GROUND_RULES.md](GROUND_RULES.md) - Learn the standards
3. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Understand the codebase
4. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solve common issues

#### DevOps/SRE

1. [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) - Deploy safely
2. [CI_WORKFLOWS.md](CI_WORKFLOWS.md) - Debug CI/CD
3. [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) - Handle incidents
4. [operations-runbook.md](operations-runbook.md) - Day-to-day operations

#### Database Administrator

1. [DB_GUIDE.md](DB_GUIDE.md) - Database procedures
2. [DB-SCHEMA.md](DB-SCHEMA.md) - Schema documentation
3. [RLS.md](RLS.md) - Security policies
4. [TROUBLESHOOTING.md](TROUBLESHOOTING.md#database-issues) - Database
   troubleshooting

#### Security Auditor

1. [SECURITY_HARDENING.md](SECURITY_HARDENING.md) - Security config
2. [GROUND_RULES.md](GROUND_RULES.md#security-ground-rules) - Security standards
3. [ENV_VARIABLES.md](ENV_VARIABLES.md) - Secret management
4. [RLS.md](RLS.md) - Data access policies

#### QA/Testing

1. [TESTING.md](TESTING.md) - Testing strategy
2. [TROUBLESHOOTING.md](TROUBLESHOOTING.md#testing-issues) - Test issues
3. [POST_DEPLOYMENT_VALIDATION.md](POST_DEPLOYMENT_VALIDATION.md) - Validation
4. [MOBILE_TESTING_GUIDE.md](../MOBILE_TESTING_GUIDE.md) - Mobile testing

## 📋 Documentation Standards

All documentation in this repository follows these standards:

### Format

- Markdown with GitHub Flavored Markdown (GFM)
- Clear headings and structure
- Code examples with syntax highlighting
- Tables for comparisons
- Emoji for visual navigation (sparingly)

### Structure

- Version and last updated date at top
- Table of contents for long documents
- Related documentation links at bottom
- Examples before complex explanations

### Maintenance

- Update when related code changes
- Review quarterly for accuracy
- Remove outdated information
- Keep examples working

### Contributing to Documentation

When adding or updating documentation:

1. **Check existing docs** - Avoid duplication
2. **Follow structure** - Match existing format
3. **Add examples** - Show, don't just tell
4. **Cross-reference** - Link to related docs
5. **Test commands** - Ensure examples work
6. **Update index** - Add to this file

## 🔄 Recent Updates

**2025-10-29**: Added comprehensive documentation suite

- GROUND_RULES.md - Mandatory standards
- PROJECT_STRUCTURE.md - Architecture and dependencies
- CI_WORKFLOWS.md - CI/CD documentation
- DB_GUIDE.md - Database procedures
- ENV_VARIABLES.md - Environment reference
- TROUBLESHOOTING.md - Common issues
- packages/README.md - Shared packages guide

## 📞 Getting Help

If you can't find what you need:

1. **Search this index** - Use Ctrl+F/Cmd+F
2. **Check TROUBLESHOOTING.md** - Most common issues covered
3. **Ask the team** - Post in team chat
4. **Open an issue** - Tag with `documentation`

## 🔗 External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Documentation](https://pnpm.io/)

---

**Maintained by**: Development Team  
**Last Updated**: 2025-10-29  
**Questions?** Open a discussion or issue.
