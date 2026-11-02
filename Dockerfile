# The "setup" stage has the development tools needed to build the API and to
# run migrations and the seed. Docker Compose uses it for the one-off setup job.
FROM node:26-slim AS setup

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Prisma's config requires a URL to generate the client, but does not connect.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build

# The default image contains only what the API needs to run.
FROM node:26-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json ./

# @prisma/client lists the Prisma CLI and TypeScript as peers, which adds about
# 250 MB. The generated client in dist does not need them at runtime.
RUN npm ci --omit=dev --legacy-peer-deps --ignore-scripts

COPY --from=setup /app/dist ./dist

USER node

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT ?? 3333) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/src/server.js"]
