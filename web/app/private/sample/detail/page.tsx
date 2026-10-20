import type { Metadata } from "next";
import JobDetailScreen from "@/app/components/JobDetailScreen";

export const metadata: Metadata = {
  title: "공고 상세 샘플",
  robots: { index: false, follow: false },
};

export default function SampleDetailPage() {
  return (
    <main className="private-page">
      <JobDetailScreen sample />
    </main>
  );
}
