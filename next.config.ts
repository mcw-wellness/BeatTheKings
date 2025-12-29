import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'beatthekingz.blob.core.windows.net',
        pathname: '/avatar/**',
      },
    ],
  },
}

export default nextConfig
