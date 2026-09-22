# Production stage
FROM node:22-alpine AS production
RUN apk add --no-cache postgresql-client \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodeuser -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy pre-built application (build locally)
COPY --chown=nodeuser:nodejs dist ./dist

# Create directories and set permissions
RUN mkdir -p uploads logs \
    && chown -R nodeuser:nodejs /app

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT:-3010}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE ${PORT:-3010}
CMD ["node", "dist/index.js"]