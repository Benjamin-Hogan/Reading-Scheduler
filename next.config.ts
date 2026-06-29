import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN IPs and tunnel URLs during dev (phone testing, localtunnel, cloudflared)
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.0.213",
    "*.loca.lt",
    "*.trycloudflare.com",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http", hostname: "books.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
