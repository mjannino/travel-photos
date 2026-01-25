import type { NextConfig } from 'next'
import withPlaiceholder from "@plaiceholder/next";

const nextConfig: NextConfig = {
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ctfassets.net',
      },
    ],
    loader: 'custom',
    loaderFile: './lib/contentful-loader.tsx',
  },
}

export default withPlaiceholder(nextConfig);
