/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sovereign/clinical-core'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'longevityiq.vercel.app'] },
  },
}

module.exports = nextConfig
