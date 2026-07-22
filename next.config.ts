import type { NextConfig } from "next";

// The site is served from the root of the custom domain:
// https://briefing.hyperdoctor.app/
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
