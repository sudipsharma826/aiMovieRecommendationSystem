import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    localPatterns: [
      {
        pathname: "/logo.png",
        search: "",
      },
    ],
  },
};

export default nextConfig;