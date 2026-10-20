import type { Metadata } from "next";
import JobDetailScreen from "@/app/components/JobDetailScreen";

export const metadata: Metadata = {
  title: "공고 상세",
  robots: { index: false, follow: false },
};

// 정적 HTML이라 누구나 열 수 있지만, 공고는 로그인한 세션으로만 /api/jobs에서 받아 그린다
export default function JobDetailPage() {
  return (
    <main className="private-page">
      <JobDetailScreen />
    </main>
  );
}
