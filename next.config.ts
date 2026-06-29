import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN IP access during dev (e.g. http://192.168.x.x:3000) without HMR/cross-origin blocks
  allowedDevOrigins: ["192.168.0.213", "127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http", hostname: "books.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
