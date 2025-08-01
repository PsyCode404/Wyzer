#!/bin/bash
# Exit on error
set -e

echo "==== Starting Render Build Process ===="
echo "Current directory: $(pwd)"

# Install frontend dependencies
echo "\n📦 Installing frontend dependencies..."
cd app
npm install

# Build frontend
echo "\n🔨 Building frontend..."
npm run build

# Show build directory contents
echo "\n📂 Build directory contents:"
ls -la build/

# Copy build files to the root directory
echo "\n📂 Copying build files to root..."
cp -r build ..

# Show root directory contents after copy
echo "\n📂 Root directory contents after copy:"
cd ..
ls -la

# Install backend dependencies
echo "\n📦 Installing backend dependencies..."
cd backend
npm install

# Show final directory structure
echo "\n📂 Final directory structure:"
cd ..
find . -maxdepth 3 -type d -not -path "*/node_modules/*" | sort

echo "\n✅ Build process completed successfully!"
