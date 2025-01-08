/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  },
  serverExternalPackages: ['@prisma/client'],
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas', 'jsdom']
    return config
  },
  experimental: {
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: '**.tiktokcdn-us.com',
      },
    ],
  },
}

module.exports = nextConfig