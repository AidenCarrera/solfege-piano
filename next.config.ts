import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['howler'],
  },
  
  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;