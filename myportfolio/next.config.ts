import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repoName = "Portfolio"; // Your repository name

const nextConfig: NextConfig = {
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  output: "export",
  // Production export goes to dist/ (deployed by the workflow). `next dev` keeps using .next/, so
  // running a build while the dev server is up can't delete files out from under it.
  distDir: isProd ? "dist" : ".next",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Keep the dev-only Next.js badge away from the Livesey toggle in the bottom-left corner
  devIndicators: {
    position: "top-left",
  },
  // Ensure static files are served correctly
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : "",
  },
};

export default nextConfig;
