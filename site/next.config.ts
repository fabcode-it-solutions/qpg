import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Expose environment variables to the browser
    NEXT_PUBLIC_AI_SOCKET_URL: process.env.NEXT_PUBLIC_AI_SOCKET_URL,
    AI_SOCKET_URL: process.env.AI_SOCKET_URL,
  },
  // Enable strict mode for React
  reactStrictMode: true,

  compress: true,

  // Bundle analyzer (enable when needed)
  // bundleAnalyzer: {
  //   enabled: process.env.ANALYZE === 'true',
  // },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: ["@/components", "@/lib", "@/hooks"],
  },
  // Configure image domains for next/image
  images: {
    domains: [
      "localhost",
      "chat.ecendfit.com",
      "s3.amazonaws.com",
      "qpg-uploads.s3.amazonaws.com",
      "cdn.sanity.io",
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
