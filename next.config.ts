import type { NextConfig } from "next";

// G3C preflight: TypeScript errors MUST fail the build. Never deploy a
// production bundle with unverified type errors.
const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
