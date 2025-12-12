# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for build (including Prisma generation)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (ci for deterministic install)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript to dist
RUN npm run build

# Production Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma calls in production
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy package files for installing production deps
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production

# Copy generated Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built artifacts from builder
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -S seacaster && adduser -S seacaster -G seacaster
USER seacaster

# Expose port (default 8080 for Cloud Run)
EXPOSE 8080

# Start command
CMD ["node", "dist/server.js"]
