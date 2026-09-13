import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/today',
        permanent: true, // 308 Permanent Redirect — browsers cache this, no repeat hits
      },
    ]
  },
};

export default nextConfig;
