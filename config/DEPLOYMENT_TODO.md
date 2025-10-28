# Deployment TODOs After Removing the Legacy Hosting Config

The repository no longer ships the previous platform-specific routing rules.
Recreate the following behaviours in your self-hosted ingress or CDN before
promoting to production:

- **Manifest headers**: Serve `/manifest.json` with
  `Content-Type: application/manifest+json` and
  `Cache-Control: public, max-age=3600`.
- **Icon caching**: Apply `Cache-Control: public, max-age=300, must-revalidate`
  to `/icons/*` assets so updated logos propagate quickly.
- **Service worker caching**: Serve `/service-worker.js` with
  `Cache-Control: public, max-age=0, must-revalidate` to guarantee clients pull
  the latest worker on each deploy.
- **Immutable static assets**: For
  `/[any].(js|css|png|svg|jpg|jpeg|gif|webp|avif|woff|woff2)`, set
  `Cache-Control: public, max-age=31536000, immutable` so hashed bundles remain
  cached.
- **Health rewrite**: Ensure `/healthz` proxies to `/api/healthz` for uptime
  checks used by monitoring scripts.
- **Regional placement**: Choose the hosting region closest to Kigali to keep
  latency low.
- **Build commands**: Preserve the build pipeline of
  `pnpm install --frozen-lockfile` followed by `pnpm run build` and expose
  `.next/` as the production bundle.

Document which ingress technology implements these rules (e.g., Nginx, Traefik,
Cloudflare) and keep this file updated as the hosting topology evolves.
