#!/bin/bash
# Exit on error
set -e

echo "==== Starting Render Build Process ===="

# Install frontend dependencies
echo "\n📦 Installing frontend dependencies..."
cd app
npm install

# Build frontend
echo "\n🔨 Building frontend..."
npm run build

# Move back to root
echo "\n🏗️  Setting up backend..."
cd ../backend

# Install backend dependencies
echo "\n📦 Installing backend dependencies..."
npm install

echo "\n✅ Build process completed successfully!"
