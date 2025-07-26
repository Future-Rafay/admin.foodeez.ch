import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "shining-fun-cae9b3168c.media.strapiapp.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "photos.hotelbeds.com",
      },
      {
        protocol: "http",
        hostname: "photos.hotelbeds.com",
      },
      {
        protocol: "https",
        hostname: "photos.hotelbeds.com",
      },
      {
        protocol: "https",
        hostname: "photos.hotelbeds.com",
      },

    ],
  },
};

export default nextConfig;
