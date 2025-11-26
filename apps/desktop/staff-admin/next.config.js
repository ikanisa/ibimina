/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Tauri expects files in the 'out' directory
  distDir: 'out',
};

module.exports = nextConfig;
