import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sharp is a native module used by Next.js for image optimization.
  // Mark it external so it is never bundled — it must be loaded via require().
  serverExternalPackages: ["sharp"],
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
