# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-03-15

### Added
- Initial release of Staff Admin PWA
- Authentication system with JWT and token refresh
- User management (CRUD operations)
- Order management with status transitions
- Ticket system with comments and status updates
- Dashboard with KPIs and charts
- Progressive Web App features:
  - Service worker with offline support
  - Background sync for write operations
  - Install prompt
  - Push notifications support
- Material UI theming (light/dark/system)
- Internationalization structure
- Mock API with MSW for development
- Docker deployment configs (HTTP and HTTPS)
- Nginx configuration with proper headers
- CI/CD pipelines (GitHub Actions)
- Comprehensive test suite (Unit + E2E)
- Complete documentation (README + RUNBOOK)

### Security
- JWT-based authentication
- HTTP-only refresh token support
- Content Security Policy headers
- Secure cookie handling
- Input validation with Zod

[1.0.0]: https://github.com/yourusername/staff-admin-pwa/releases/tag/v1.0.0
