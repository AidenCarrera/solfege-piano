import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Analytics is same-origin in production but cross-origin in development.
 */
const analyticsOrigins = isDevelopment ? ["https://va.vercel-scripts.com"] : [];

const contentSecurityPolicy = [
  "default-src 'self'",
  // Required for the inline theme and JSON-LD scripts. A nonce would require middleware.
  ["script-src 'self' 'unsafe-inline'", ...analyticsOrigins]
    .concat(isDevelopment ? ["'unsafe-eval'"] : [])
    .join(" "),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "media-src 'self'",
  ["connect-src 'self'", ...analyticsOrigins].join(" "),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/**
 * Allows a LAN origin for mobile development. Next.js handles localhost and
 * the server's own hostname automatically.
 */
const devOrigin = process.env.DEV_ORIGIN?.trim();

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigin ? [devOrigin] : [],
  poweredByHeader: false,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
