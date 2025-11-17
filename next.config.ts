import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone', // For Docker deployment
  eslint: {
    ignoreDuringBuilds: true, // For MVP clickthrough prototype
  },
  typescript: {
    ignoreBuildErrors: true, // For MVP clickthrough prototype
  },
}

export default nextConfig