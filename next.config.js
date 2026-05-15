/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@sovereign/clinical-core'],
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000', 'longevityiq.vercel.app'] },
  },
  async rewrites() {
    return [
      // Root URL keeps serving the existing wellness SPA (public/index.html).
      // The Next.js Sovereign OS lives at /portal and the named portal routes.
      { source: '/', destination: '/index.html' },
    ]
  },
}

module.exports = nextConfig
