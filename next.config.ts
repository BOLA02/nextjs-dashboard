import type { NextConfig } from 'next';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Allows build to continue even with ESLint warnings
  },
};

export default nextConfig;
