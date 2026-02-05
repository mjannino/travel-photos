import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',

  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {},

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.mikejannino.photography',
      },
    ],
  },
}

export default nextConfig
