# Root Dockerfile for Render deployment
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
COPY backend/ ./

# Install dependencies
RUN npm ci --only=production

# Expose port
EXPOSE 10000

# Start the backend
CMD ["node", "server.js"]
