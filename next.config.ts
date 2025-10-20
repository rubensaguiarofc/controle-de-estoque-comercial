
import { CommandItem } from 'cmdk';
import type { NextConfig } from 'next';

// Allow switching between static export (for mobile/Capacitor) and server mode (for web)
// Set NEXT_OUTPUT_EXPORT=false to run in server mode (API routes enabled for web hosting)
const useExport = process.env.NEXT_OUTPUT_EXPORT !== 'false';

const nextConfig: NextConfig = {
  /* config options here */
  ...(useExport ? { output: 'export' as const } : {}),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Required for static export without the Next image optimizer
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

