# Multi-stage build untuk optimasi
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy dependencies dari builder
COPY --from=builder /app/node_modules ./node_modules

# Copy aplikasi
COPY . .

# Expose port
EXPOSE 3000

# Create non-root user untuk keamanan
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Health check (gunakan PORT dari env jika ada)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000; require('http').get(`http://localhost:${p}/health`, (r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

# Start aplikasi
CMD ["node", "src/server.js"]

