"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import JobDetail from "./JobDetail";
import { type Job, LOGIN_EXPIRED, applyJob, channelOptions, fetchJobs, todayYmd } from "./jobs";
import { sampleJobs } from "./sampleJobs";

const noSubscribe = () => () => {};

// 공고 상세 페이지(/private/jobs/detail/?id=, 샘플은 /private/sample/detail/?id=).
// 지원 경로 선택지가 전체 공고의 도메인에서 나오므로, 실제 화면도 공고 하나가 아니라 목록을 받아 고른다
export default function JobDetailScreen({ sample = false }: { sample?: boolean }) {
  // 정적 HTML에는 쿼리가 없으므로 서버 값은 null, 브라우저에서만 실제 주소를 읽는다
  const id = useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).get("id"), () => null);
  const sampleList = useSyncExternalStore(sampleJobs.subscribe, sampleJobs.getSnapshot, sampleJobs.getServerSnapshot);
  const [live, setLive] = useState<Job[] | "loading" | "error">("loading");
  const listHref = sample ? "/private/sample/" : "/private/jobs/";

  useEffect(() => {
    if (sample) return;
    fetchJobs().then((result) => {
      if (result === "expired") window.location.replace(LOGIN_EXPIRED);
      else setLive(result);
    });
  }, [sample]);

  // 실제 화면은 내 공고만, 샘플 화면은 예시 공고만 (목록과 같다)
  const jobs = sample ? sampleList : Array.isArray(live) ? live : null;
  const job = id && jobs ? jobs.find((j) => j.id === id) : undefined;

  async function markApplied(appliedVia: string): Promise<boolean> {
    if (!job) return false;
    if (sample) {
      sampleJobs.update(job.id, { status: "applied", applied_at: todayYmd(), applied_via: appliedVia });
      return true;
    }
    const updated = await applyJob(job.id, appliedVia);
    if (!updated) return false;
    setLive((prev) => (Array.isArray(prev) ? prev.map((j) => (j.id === updated.id ? updated : j)) : prev));
    return true;
  }

  let content: React.ReactNode = null;
  if (id !== null) {
    if (!sample && live === "loading") {
      content = (
        <p className="jobs-message" role="status">
          공고를 불러오는 중입니다.
        </p>
      );
    } else if (!sample && live === "error") {
      content = (
        <p className="jobs-message" role="alert">
          공고를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.
        </p>
      );
    } else if (!job || !jobs) {
      content = <p className="jobs-message">공고를 찾을 수 없습니다.</p>;
    } else {
      content = (
        <>
          <header className="private-head">
            <p className="entry-card-label">
              {sample ? "SAMPLE DATA" : "PRIVATE AREA"} · {job.company}
            </p>
            <h1>{job.title}</h1>
          </header>
          <div className="job-detail-page">
            <JobDetail
              job={job}
              channels={channelOptions(jobs)}
              sample={sample}
              onApply={markApplied}
            />
          </div>
        </>
      );
    }
  }

  return (
    <>
      <Link href={listHref} className="private-back">
        ← 공고 목록
      </Link>
      {content}
    </>
  );
}
