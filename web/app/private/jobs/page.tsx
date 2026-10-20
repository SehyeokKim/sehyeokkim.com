import type { Metadata } from "next";
import Link from "next/link";
import JobsBoard from "@/app/components/JobsBoard";

export const metadata: Metadata = {
  title: "공고 목록",
  robots: { index: false, follow: false },
};

// 정적 HTML이라 누구나 열 수 있지만, 목록은 로그인한 세션으로만 /api/jobs에서 받아 그린다
export default function JobsPage() {
  return (
    <main className="private-page">
      <Link href="/private/" className="private-back">
        ← 비공개 대시보드
      </Link>
      <header className="private-head">
        <p className="entry-card-label">PRIVATE AREA</p>
        <h1>공고 목록</h1>
        <p className="private-lead">마감이 빠른 순서입니다. 공고를 누르면 상세 화면에서 지원 완료를 기록할 수 있습니다. &quot;예시&quot; 표시가 붙은
          공고는 화면 구성을 보여 주는 가짜 데이터라 저장되지 않습니다.</p>
      </header>
      <JobsBoard />
    </main>
  );
}
