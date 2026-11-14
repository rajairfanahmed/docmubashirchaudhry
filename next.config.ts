import type { NextConfig } from "next";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://flagcdn.com https://upload.wikimedia.org https://img.logo.dev https://img.clerk.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.supabase.co https://*.r2.cloudflarestorage.com",
  "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' mailto:"
].join("; ");

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/**/*": ["./public/data/v1/manifest.json"],
    "/status": ["./public/data/v1/manifest.json"],
    "/sitemap.xml": ["./public/data/v1/manifest.json"]
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"]
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com"
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org"
      },
      {
        protocol: "https",
        hostname: "img.logo.dev"
      },
      {
        protocol: "https",
        hostname: "img.clerk.com"
      }
    ]
  },
  async headers() {
    const globalSecurityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload"
      },
      ...(isProduction
        ? [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }]
        : [])
    ];

    return [
      {
        source: "/:path*",
        headers: globalSecurityHeaders
      },
      {
        source: "/data/v1/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, stale-while-revalidate=86400"
          }
        ]
      },
      {
        source: "/documents/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          }
        ]
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400"
          }
        ]
      },
      {
        source: "/icon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400"
          }
        ]
      },
      {
        source: "/favicon.svg",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
