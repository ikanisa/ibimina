ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG OPENAI_API_KEY
ARG OPENAI_RESPONSES_MODEL

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN corepack enable \
  && pnpm fetch

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG OPENAI_API_KEY
ARG OPENAI_RESPONSES_MODEL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV OPENAI_RESPONSES_MODEL=${OPENAI_RESPONSES_MODEL}
COPY --from=deps /root/.local/share/pnpm /root/.local/share/pnpm
COPY . .
RUN corepack enable \
  && pnpm install --frozen-lockfile --offline \
  && pnpm run build

FROM node:20-bookworm-slim AS prod-deps
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY --from=deps /root/.local/share/pnpm /root/.local/share/pnpm
RUN corepack enable \
  && pnpm install --frozen-lockfile --prod --offline

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3100
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG OPENAI_API_KEY
ARG OPENAI_RESPONSES_MODEL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV OPENAI_RESPONSES_MODEL=${OPENAI_RESPONSES_MODEL}
EXPOSE 3100
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY next.config.ts ./next.config.ts
COPY service-worker.js ./service-worker.js
RUN corepack enable
CMD ["pnpm", "run", "start"]
