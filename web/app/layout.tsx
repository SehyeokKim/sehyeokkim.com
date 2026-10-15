import type { Metadata, Viewport } from "next";
import "./globals.css";
import { profile } from "@/content/resume";

export const metadata: Metadata = {
  title: `${profile.name} | 이력서`,
  description: `${profile.name}의 이력서와 프로젝트. AWS 위에 직접 설계 · 배포 · 운영하는 사이트입니다.`,
  openGraph: {
    title: `${profile.name} | 이력서`,
    description: "클라우드 · 인프라 엔지니어 지원자의 이력서와 프로젝트",
    type: "profile",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
