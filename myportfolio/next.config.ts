import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "Portfolio"; // Your repository name

const nextConfig: NextConfig = {
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  output: "export",
  distDir: "dist",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Ensure static files are served correctly
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : "",
  },
};

export default nextConfig;
