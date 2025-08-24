# Simplified full-stack Dockerfile
FROM node:18-alpine

# Install curl
RUN apk add --no-cache curl

# Set working directory
WORKDIR /usr/src/app

# Copy frontend package files and install dependencies
COPY app/package*.json ./frontend/
RUN cd frontend && npm ci

# Copy frontend source and build
COPY app/ ./frontend/
# Set production API URL for React build
ENV REACT_APP_API_URL=https://wyzer.onrender.com
RUN cd frontend && npm run build

# Copy backend package files and install dependencies  
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Move frontend build to expected location
RUN mkdir -p build && cp -r frontend/build/* build/

# Expose port
EXPOSE 10000

# Start server
CMD ["node", "server.js"]
