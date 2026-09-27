import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["savorous-an-bilineate.ngrok-free.dev"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
