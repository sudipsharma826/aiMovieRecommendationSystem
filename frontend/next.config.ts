import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for image optimization issues in deployment
  images: {
    unoptimized: true,
  },
  
  // Ensure trailing slashes for consistent routing
  trailingSlash: true,
  
  // Enable strict mode for better error handling
  reactStrictMode: true,
  
  // Ensure the app directory is properly recognized
  experimental: {
    appDir: true,
  },
};

export default nextConfig;
