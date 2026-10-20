import type { Metadata } from "next";
import Link from "next/link";
import SampleJobsBoard from "./SampleJobsBoard";

export const metadata: Metadata = {
  title: "공고 목록 샘플",
  robots: { index: false, follow: false },
};

// 로그인 없이 보는 샘플 화면. 실제 목록과 같은 컴포넌트에 data/sample/의 가짜 공고만 넣고, API는 부르지 않는다
export default function SamplePage() {
  return (
    <main className="private-page">
      <Link href="/" className="private-back">
        ← 이력서로 돌아가기
      </Link>
      <header className="private-head">
        <p className="entry-card-label">SAMPLE DATA</p>
        <h1>공고 목록</h1>
        <p className="private-lead">
          로그인한 화면과 같은 구성을 가짜 데이터로 보여 줍니다. 회사와 공고는 실제가 아니고, 링크는 example.com으로
          연결됩니다.
        </p>
      </header>
      <SampleJobsBoard />
    </main>
  );
}
