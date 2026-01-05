# Multi-stage build for Next.js
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry data about general usage.
# Disable telemetry during the build
ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy files needed for migrations and seeding
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/scripts ./scripts
COPY --from=deps /app/node_modules ./node_modules

# Install tools needed for migrations and seeding
RUN npm install tsx drizzle-kit --save-prod

# Make startup script executable
RUN chmod +x ./scripts/startup.sh

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Run startup script (handles migrations + starts server)
CMD ["./scripts/startup.sh"]