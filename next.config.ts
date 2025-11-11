import type { NextConfig } from 'next';

// Allow switching between static export (for mobile/Capacitor) and server mode (for web)
// Set NEXT_OUTPUT_EXPORT=false to run in server mode (API routes enabled for web hosting)
const useExport = process.env.NEXT_OUTPUT_EXPORT !== 'false';

const nextConfig: NextConfig = {
  /* config options here */
  ...(useExport ? { output: 'export' as const } : {}),
  // Ensure Next traces from the project folder, not the parent workspace root with another lockfile
  outputFileTracingRoot: __dirname,
  // Emit production browser source maps so runtime errors in the Android WebView
  // can be mapped back to original TS/TSX sources. This is required to diagnose
  // the `.subscribe` undefined runtime exception seen in the device logs.
  productionBrowserSourceMaps: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Workaround: avoid Webpack/Next attempting to readlink files on Windows (Node 22)
  // which can throw EISDIR in some environments. Disabling symlink resolution
  // keeps paths as-is and bypasses readlink/realpath calls.
  webpack: (config) => {
    if (!config.resolve) config.resolve = {} as any;
    (config.resolve as any).symlinks = false;
    // Disable webpack filesystem cache to avoid snapshot/readlink operations
    // which are causing EISDIR errors on Windows with Node 22.
    (config as any).cache = false;
    return config;
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

