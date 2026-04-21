# ── Build stage ───────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root + package files
COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY tsconfig.base.json ./
COPY shared/ shared/
COPY server/ server/
COPY client/ client/

# Build client (Vue SPA) — VITE_API_URL tells the client where the API lives
ARG VITE_API_URL=https://tiertogether.fr
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build:client

# Build server (TypeScript → JS)
RUN npm run build:server

# ── Production stage ──────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/

# Install production dependencies only
RUN npm install --omit=dev

# Copy shared types
COPY shared/ shared/

# Copy built server
COPY --from=builder /app/server/dist server/dist

# Copy built client
COPY --from=builder /app/client/dist client/dist

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "server/dist/server/src/index.js"]
