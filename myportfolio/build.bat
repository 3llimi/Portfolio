@echo off

REM Portfolio Build Script for Windows
REM This script builds the Next.js project for GitHub Pages deployment

echo 🚀 Building Portfolio for GitHub Pages...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

REM Build the project
echo 🔨 Building the project...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build completed successfully!
echo 📁 Built files are in the 'dist' directory
echo 🌐 To test locally, run: npx serve dist
echo 🚀 To deploy, push to main branch or run the GitHub Actions workflow
pause