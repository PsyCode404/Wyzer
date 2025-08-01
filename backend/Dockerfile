# Use Node.js LTS
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app (if needed)
# RUN npm run build

# Expose the app port
EXPOSE 10000

# Start the application
CMD ["node", "server.js"]
