import type { NextConfig } from "next";

// S3 + CloudFront로 서빙하는 정적 사이트. 서버 기능(SSR, API 라우트, 이미지 최적화)은 쓰지 않는다.
const nextConfig: NextConfig = {
  output: "export",
  // /private → /private/index.html 로 내보내 S3 객체 경로와 맞춘다
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
