import type { NextConfig } from "next";

// briefing.hyperdoctor.app 커스텀 도메인으로 루트 경로에서 서빙하므로 basePath는
// 사용하지 않는다. (public/CNAME 파일로 커스텀 도메인 설정을 배포마다 유지한다.)
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
