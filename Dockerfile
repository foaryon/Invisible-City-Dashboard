# The Invisible City — single-image production build.
# The API (Fastify) serves both /api/* and the built SPA.
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install workspace dependencies (better-sqlite3 needs build tooling).
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
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
RUN npm run build --workspace apps/web

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3001
# Copy the whole built workspace (tsx runs the API from source; the web is prebuilt).
COPY --from=build /app /app
EXPOSE 3001
# Live is the default; demo stays off unless ENABLE_DEMO=1 is set.
CMD ["npm", "run", "start", "--workspace", "apps/api"]
