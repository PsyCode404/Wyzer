# Use Node.js 18 LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy all backend files
COPY . .

# Create a non-root user to run the app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to the nodejs user
USER nodejs

# Expose the port
EXPOSE 10000

# Start the application
CMD ["node", "server.js"]
