import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@takumi-rs/image-response'],
  output: 'export',
  // next/image optimization is not supported in static exports;
  // Cloudflare Pages serves images as-is from the out/ directory.
  images: {
    unoptimized: true,
  },

  reactStrictMode: true,
};

export default withMDX(config);
