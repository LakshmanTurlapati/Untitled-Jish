# --- Build stage ---
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y \
    python3 make g++ curl gunzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Build the database if it doesn't exist
RUN if [ ! -f data/sanskrit.db ]; then \
      bash scripts/setup-data.sh && \
      npx tsx scripts/import-dictionary.ts && \
      npx tsx scripts/build-stem-index.ts; \
    fi

# Build Next.js
RUN npm run build

# --- Production stage ---
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy built app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/data/sanskrit.db ./data/sanskrit.db

EXPOSE 3000

CMD ["node", "server.js"]
