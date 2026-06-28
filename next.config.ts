import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sharp is a native module used by Next.js for image optimization.
  // Mark it external so it is never bundled — it must be loaded via require().
  serverExternalPackages: ["sharp"],

  // Exclude static media from Lambda NFT bundles.
  // public/media/ and MEDIA/ are served by Vercel's CDN, not the Lambda.
  // Without this, Vercel lstat-fails on any media file missing from git.
  outputFileTracingExcludes: {
    "**": ["public/media/**", "MEDIA/**", "public/uploads/**"],
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
    ],
  },
};

export default nextConfig;
