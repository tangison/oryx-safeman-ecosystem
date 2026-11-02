import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pure static export — hostable on any static provider (Vercel free tier, $0).
  output: 'export',
  // Directory URLs (/foo/ -> /foo/index.html) — friendlier for static hosts.
  trailingSlash: true,
  images: { unoptimized: true },
  // Pin the workspace root to this repo (avoids lockfile-inference warnings
  // when the repo sits inside a larger checkout).
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
