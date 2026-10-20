import path from "node:path";
import type { NextConfig } from "next";

// S3 + CloudFront로 서빙하는 정적 사이트. 서버 기능(SSR, API 라우트, 이미지 최적화)은 쓰지 않는다.
const nextConfig: NextConfig = {
  output: "export",
  // /private → /private/index.html 로 내보내 S3 객체 경로와 맞춘다
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  // 샘플 화면이 저장소 루트의 data/sample/(공개 데모용 가짜 데이터)을 읽을 수 있게 기준 폴더를 한 단계 위로 둔다
  turbopack: { root: path.join(__dirname, "..") },
};

export default nextConfig;
