import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty', 'pino-roll'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'beatthekingz.blob.core.windows.net',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
