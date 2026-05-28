import type { NextConfig } from "next";

// Vercel Blob serves files from its own CDN host (*.public.blob.vercel-storage.com)
// and does NOT support custom domains. To make shared links read as estaila.com,
// we proxy /cdn/* at the edge to the blob store. Override the store base with the
// BLOB_PUBLIC_BASE_URL env var if the store changes.
const BLOB_PUBLIC_BASE_URL =
  process.env.BLOB_PUBLIC_BASE_URL ??
  "https://jpq6i52yfvzekjol.public.blob.vercel-storage.com";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Storage backends
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
      // OAuth provider avatars
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Stock / image services
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
  async rewrites() {
    return [
      // Branded image links: estaila.com/cdn/<key> → Vercel Blob CDN
      { source: "/cdn/:path*", destination: `${BLOB_PUBLIC_BASE_URL}/:path*` },
    ];
  },
};

export default nextConfig;
