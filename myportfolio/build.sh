#!/bin/bash

# Portfolio Build Script
# This script builds the Next.js project for GitHub Pages deployment

echo "🚀 Building Portfolio for GitHub Pages..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Built files are in the 'dist' directory"
    echo "🌐 To test locally, run: npx serve dist"
    echo "🚀 To deploy, push to main branch or run the GitHub Actions workflow"
else
    echo "❌ Build failed!"
    exit 1
fi