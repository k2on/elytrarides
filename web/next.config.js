/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['shared'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
      serverActions: true,
  }
};

module.exports = nextConfig;
