/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for desktop deployment
  output: 'standalone',
  
  // Empty turbopack config to silence Next.js 16 warning
  turbopack: {},
  
  // Disable webpack DevMiddleware for pkg compatibility
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: false,
        ignored: /node_modules/,
      };
    }
    return config;
  },
  
  // Headers for API caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;