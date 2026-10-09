FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Dynamic pages read the real database and auth settings at runtime.
RUN DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build AUTH_SECRET=build-only-placeholder npm run build

FROM dependencies AS migrations
COPY drizzle.config.ts ./
COPY src/db/schema.ts ./src/db/schema.ts
CMD ["npx", "--no-install", "drizzle-kit", "push"]

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=15s --start-period=30s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health', { signal: AbortSignal.timeout(12000) }).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
