import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  // Ignore server-only packages on the client side
  serverExternalPackages: ["@remotion/lambda", "@remotion/lambda-client"],
  
  // Set Turbopack root to the frontend folder to avoid watching the parent directory,
  // which contains active backend uploads, logs, and other dynamic lockfiles.
  turbopack: {
    root: path.join(__dirname),
  },
  async headers() {
    return [
      {
        source: "/:path*(svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|ogg)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
