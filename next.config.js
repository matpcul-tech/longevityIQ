/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sovereign/clinical-core'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'longevityiq.vercel.app'] },
  },
  // / is served by app/route.ts which streams public/index.html directly.
  // No rewrites needed.
}

module.exports = nextConfig
