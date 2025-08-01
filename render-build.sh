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

# Move build files to the root directory
echo "\n📂 Moving build files to root..."
cp -r build ../

# Move back to root
echo "\n🏗️  Setting up backend..."
cd ..

# Install backend dependencies
echo "\n📦 Installing backend dependencies..."
cd backend
npm install

# Move back to root for the start command
cd ..

echo "\n✅ Build process completed successfully!"
