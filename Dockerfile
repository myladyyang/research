# syntax=docker.io/docker/dockerfile:1

FROM node:22-slim AS base

RUN apt-get update -y \
    && apt-get install -y openssl iputils-ping wget  \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml\* ./
COPY prisma ./prisma/

RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma client for the target platform
RUN \
    if [ -f yarn.lock ]; then yarn prisma generate; \
    elif [ -f package-lock.json ]; then npx prisma generate; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm prisma generate; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Build the application
RUN \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Final stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV CHECKPOINT_DISABLE=1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Create necessary directories and set permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && \
    chown nextjs:nodejs .next && \
    mkdir ./logexport && \
    chown nextjs:nodejs ./logexport && \
    mkdir -p /nonexistent/.local/share/applications && \
    chown nextjs:nodejs /nonexistent/.local/share/applications && \
    mkdir -p ./rulesets && \
    chown nextjs:nodejs ./rulesets && \
    chmod 755 ./rulesets

# Copy next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]