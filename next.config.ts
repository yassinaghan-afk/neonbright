import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },

  // Public upload URLs (/uploads/...) rewrite to the secure API file server.
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },

  outputFileTracingIncludes: {
    "**": [
      "./data/cms-content.json",
      "./data/seo-registry.json",
      "./node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },

  outputFileTracingExcludes: {
    "**": [
      "public/media/**",
      "MEDIA/**",
      "public/uploads/**",
      "scripts/**",
      "storage/**",
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
      // Legacy Blob URLs — existing CMS image URLs until migration utility is run.
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
