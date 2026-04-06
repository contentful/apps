/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // Static export for Contentful App Hosting (Marketplace requirement)
  output: 'export',
};

module.exports = nextConfig;
