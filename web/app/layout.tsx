import type { Metadata, Viewport } from "next";
// 글꼴: Pretendard (SIL Open Font License 1.1). 쓰는 글자만 내려받는 분할 버전
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./theme.css";
import "./globals.css";
import { profile, site } from "@/content/resume";

export const metadata: Metadata = {
  // cloudfront.net 주소로 들어와도 검색 엔진이 대표 주소를 sehyeokkim.com으로 보게 한다
  metadataBase: new URL(site.url),
  alternates: { canonical: "/" },
  title: `${profile.name} | 이력서`,
  description: `${profile.name}의 이력서와 프로젝트. AWS 위에 직접 설계 · 배포 · 운영하는 사이트입니다.`,
  openGraph: {
    title: `${profile.name} | 이력서`,
    description: "클라우드 · 인프라 엔지니어 지원자의 이력서와 프로젝트",
    url: "/",
    type: "profile",
    locale: "ko_KR",
    // app/og.png/route.tsx가 빌드 때 그리는 미리보기 이미지
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${profile.name} — ${profile.role}` }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08090c" },
  ],
};

// 새로고침하면 브라우저가 직전 스크롤 위치나 주소의 #위치(목차 · 프로젝트 요약을 누르면 붙는다)로 돌아가므로,
// 새로고침일 때만 #을 지우고 맨 위에서 시작한다. 처음 들어온 #링크(공유받은 주소 등)는 그대로 그 위치로 간다.
// 화면을 그리기 전에 실행돼야 아래에서 위로 튀는 모습이 보이지 않아 <head>에 바로 넣는다.
// Chrome은 새로고침을 시작할 때의 #위치로 문서를 읽은 뒤 스크롤하므로, 문서 준비 · 로드 시점에도 한 번 더 맨 위로 보낸다.
// 사이트의 부드러운 스크롤(scroll-behavior: smooth)이 끼어들지 않게 즉시 이동한다
const startAtTopOnReload = `(function(){try{var n=performance.getEntriesByType("navigation")[0];if(!n||n.type!=="reload")return;history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search);var top=function(){window.scrollTo({top:0,left:0,behavior:"instant"});};top();document.addEventListener("DOMContentLoaded",top,{once:true});window.addEventListener("load",function(){top();requestAnimationFrame(top);},{once:true});}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <script dangerouslySetInnerHTML={{ __html: startAtTopOnReload }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
