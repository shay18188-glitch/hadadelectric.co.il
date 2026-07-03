import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Product images in the Base44 catalog come from many different
    // supplier/CDN hosts (not a fixed set), so we allow any HTTPS host
    // rather than trying to maintain an exhaustive allowlist. If you
    // want to lock this down later, replace with specific hostnames
    // once the real set of image hosts stabilizes.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
