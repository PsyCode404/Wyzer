#!/bin/bash
# Exit on error
set -e

echo "==== Starting Render Build Process ===="
echo "Current directory: $(pwd)"

# Show initial directory structure
echo "\n📂 Initial directory structure:"
ls -la

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

# Create the target build directory in the root
cd ..
mkdir -p /opt/render/project/build

# Copy build files to the Render project directory
echo "\n📂 Copying build files to /opt/render/project/build..."
cp -r app/build/* /opt/render/project/build/

# Also copy to root for good measure
mkdir -p build
cp -r app/build/* build/

# Show directory contents after copy
echo "\n📂 /opt/render/project/build contents:"
ls -la /opt/render/project/build/

echo "\n📂 Root build directory contents:"
ls -la build/

# Install backend dependencies
echo "\n📦 Installing backend dependencies..."
cd backend
npm install

# Show final directory structure
echo "\n📂 Final directory structure:"
cd ..
find . -maxdepth 3 -type d -not -path "*/node_modules/*" | sort

# Verify the build files exist in expected locations
echo "\n🔍 Verifying build files..."
if [ -f "/opt/render/project/build/index.html" ]; then
  echo "✅ Found index.html in /opt/render/project/build/"
else
  echo "❌ index.html not found in /opt/render/project/build/"
  echo "Current directory: $(pwd)"
  echo "Contents of /opt/render/project/:"
  ls -la /opt/render/project/
  exit 1
fi

echo "\n✅ Build process completed successfully!"
