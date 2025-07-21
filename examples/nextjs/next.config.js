/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "export",
  distDir: 'out',
  images: {
    unoptimized: true
  },
  assetPrefix: './',
};

module.exports = nextConfig;
