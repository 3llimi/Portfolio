# GitHub Pages Deployment Guide

This guide explains how to deploy your Next.js portfolio to GitHub Pages.

## Prerequisites

1. Make sure your repository is public or you have GitHub Pro/Team
2. Enable GitHub Pages in your repository settings
3. Set the source to "GitHub Actions" (not "Deploy from a branch")

## Deployment Steps

### Automatic Deployment (Recommended)

1. **Push to main branch**: Every time you push to the main branch, GitHub Actions will automatically build and deploy your site.

2. **Manual deployment**: You can trigger a manual deployment by going to the Actions tab in your repository and clicking "Run workflow" on the "Deploy Portfolio site to Pages" workflow.

### Manual Deployment

If you prefer to build and deploy manually:

```bash
# Navigate to the project directory
cd myportfolio

# Install dependencies
npm install

# Build the project
npm run build

# The built files will be in the 'dist' directory
```

## Configuration

The following configurations are already set up for GitHub Pages:

- `next.config.ts`: Configured for static export with proper basePath
- `.github/workflows/nextjs.yml`: GitHub Actions workflow for automatic deployment
- `public/.nojekyll`: Prevents Jekyll processing
- `package.json`: Added export script

## Important Notes

1. **Repository Name**: Make sure the `repoName` in `next.config.ts` matches your actual repository name
2. **Images**: All images should be in the `public/images/` directory
3. **Icons**: All icons should be in the `public/icons/` directory
4. **Base Path**: The site will be available at `https://yourusername.github.io/Portfolio/`

## Troubleshooting

### Common Issues

1. **404 Error**: Make sure GitHub Pages is enabled and set to "GitHub Actions"
2. **Missing Assets**: Check that all images and icons are in the public directory
3. **Build Errors**: Check the Actions tab for build logs

### Local Testing

To test the production build locally:

```bash
npm run build
npx serve dist
```

## Repository Settings

Go to your repository settings and ensure:

1. **Pages** section is set to "Deploy from GitHub Actions"
2. **Actions** are enabled
3. Repository is public (or you have the required GitHub plan)

Your site will be available at: `https://yourusername.github.io/Portfolio/`