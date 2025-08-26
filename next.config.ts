import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.ai-scaleup.com",
        pathname: "/wp-content/uploads/**", // optional: restrict only to uploads folder
      },
    ],
    // if you want to allow multiple domains, just add more objects here
  },
};

export default nextConfig;
