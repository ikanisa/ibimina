# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Corepack + pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# Copy manifests first (better caching)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Ensure standalone output for simple runtime
# (also set this in next.config.[jt]s: output: 'standalone')
RUN pnpm build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# Prevent Next telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone server and assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# The standalone server exposes a server.js entry
EXPOSE 3000
# Make sure your next.config sets runtime: 'nodejs' for any routes
CMD ["node", "server.js"]
