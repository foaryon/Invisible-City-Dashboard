# The Invisible City — lean production image.
# Everything is pure JS now (SQLite = Node built-in node:sqlite), so the build
# needs no native toolchain and the runtime ships ONLY the server bundle + SPA.
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/
COPY packages/evidence/package.json packages/evidence/
COPY packages/providers/package.json packages/providers/
COPY packages/map-style/package.json packages/map-style/
COPY packages/test-fixtures/package.json packages/test-fixtures/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci

COPY . .
RUN npm run build --workspace apps/web && node scripts/build-server.mjs

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001 WEB_ROOT=/app/web
COPY --from=build /app/apps/api/dist/server.mjs /app/server.mjs
COPY --from=build /app/apps/web/dist /app/web
COPY LICENSE README.md ./
EXPOSE 3001
# Direct node process (PID-1-friendly): SIGTERM from `docker stop` reaches the
# graceful-shutdown handler. Live is the default; demo needs ENABLE_DEMO=1.
CMD ["node", "server.mjs"]
