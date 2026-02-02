import { withContentlayer } from 'next-contentlayer'
import path from 'node:path'

const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const basePath = configuredBasePath;

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : '',
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_DATA_BASE_URL: process.env.NEXT_PUBLIC_DATA_BASE_URL || '',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'contentlayer/generated': path.join(process.cwd(), '.contentlayer', 'generated'),
    }
    return config
  },
};

export default withContentlayer(nextConfig);
