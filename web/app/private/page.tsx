import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Private",
  robots: { index: false, follow: false },
};

// TODO: 로그인(Google OIDC) · 대시보드 화면. 지금은 자리표시
export default function PrivatePage() {
  return (
    <main className="private-stub">
      <p className="entry-card-label">PRIVATE AREA</p>
      <h1>비공개 대시보드</h1>
      <p className="muted">로그인 화면이 들어갈 자리입니다. (디자인 시안 단계)</p>
      <Link href="/">← 이력서로 돌아가기</Link>
    </main>
  );
}
