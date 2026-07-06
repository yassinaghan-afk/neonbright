import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  // Ensure CMS JSON shipped with serverless functions (read via fs at runtime).
  outputFileTracingIncludes: {
    "**": [
      "./data/cms-content.json",
      "./data/seo-registry.json",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },

  // Exclude static media from Lambda NFT bundles.
  // public/media/ and MEDIA/ are served by Vercel's CDN, not the Lambda.
  // Without this, Vercel lstat-fails on any media file missing from git.
  outputFileTracingExcludes: {
    "**": [
      "public/media/**",
      "MEDIA/**",
      "public/uploads/**",
      "scripts/**",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.cdninstagram.com",
      },
      {
        protocol: "https",
        hostname: "**.fbcdn.net",
      },
      {
        protocol: "https",
        hostname: "**.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "**.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
