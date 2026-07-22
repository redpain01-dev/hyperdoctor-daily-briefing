import type { NextConfig } from "next";

// GitHub Actions에서는 GITHUB_REPOSITORY="owner/repo" 형태로 자동 제공된다.
// <owner>.github.io 저장소(유저/조직 페이지)가 아니라면 GitHub Pages는
// https://<owner>.github.io/<repo>/ 하위 경로로 서빙되므로 basePath가 필요하다.
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const isUserOrOrgPage = repoName?.endsWith(".github.io") ?? false;
const basePath = repoName && !isUserOrOrgPage ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
