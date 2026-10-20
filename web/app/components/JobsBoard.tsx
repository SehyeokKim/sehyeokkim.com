"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type Job = {
  id: string;
  company: string;
  title: string;
  url: string;
  deadline: string | null;
  location: string | null;
  employment_type: string | null;
  source: string;
  status: "new" | "candidate" | "applied" | "excluded";
  fit: "high" | "mid" | "low" | null;
  memo: string | null;
  collected_at: string;
};

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; jobs: Job[] };

const statusLabel: Record<Job["status"], string> = {
  candidate: "지원 후보",
  new: "새 공고",
  applied: "지원 완료",
  excluded: "제외",
};
const statusClass: Record<Job["status"], string> = { candidate: "status signal", new: "status", applied: "status ok", excluded: "status" };
const fitLabel: Record<NonNullable<Job["fit"]>, string> = { high: "적합도 상", mid: "적합도 중", low: "적합도 하" };
const filters: (Job["status"] | "all")[] = ["all", "candidate", "new", "applied", "excluded"];

function dday(deadline: string | null): string {
  if (!deadline) return "상시";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${deadline}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "마감";
  return days === 0 ? "오늘 마감" : `D-${days}`;
}

const noSubscribe = () => () => {};

// 세션이 없거나 만료됐으면 null (호출한 쪽이 /private로 돌려보낸다)
async function fetchJobs(): Promise<State | null> {
  try {
    const res = await fetch("/api/jobs", { credentials: "same-origin", cache: "no-store" });
    if (res.status === 401) return null;
    if (!res.ok) return { kind: "error" };
    return { kind: "ready", jobs: (await res.json()).items };
  } catch {
    return { kind: "error" };
  }
}

// 로그인한 본인의 공고 목록. sampleJobs를 주면 API를 부르지 않고 그 가짜 데이터로 같은 화면을 그린다(/private/sample)
export default function JobsBoard({ sampleJobs }: { sampleJobs?: Job[] }) {
  const [state, setState] = useState<State>(sampleJobs ? { kind: "ready", jobs: sampleJobs } : { kind: "loading" });
  // D-day는 오늘 날짜로 계산하므로 빌드 시점의 정적 HTML에는 목록을 넣지 않고 브라우저에서만 그린다
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const apply = useCallback((next: State | null) => {
    if (next) setState(next);
    else window.location.replace("/private/?error=expired");
  }, []);

  useEffect(() => {
    if (!sampleJobs) fetchJobs().then(apply);
  }, [apply, sampleJobs]);

  function retry() {
    setState({ kind: "loading" });
    fetchJobs().then(apply);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    window.location.replace("/private/");
  }

  const jobs = state.kind === "ready" ? state.jobs.filter((j) => filter === "all" || j.status === filter) : [];

  return (
    <>
      <div className="jobs-toolbar">
        <div className="jobs-filters" role="group" aria-label="상태로 거르기">
          {filters.map((f) => (
            <button key={f} type="button" className="jobs-filter" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "전체" : statusLabel[f]}
              {state.kind === "ready" && (
                <span className="jobs-count">
                  {f === "all" ? state.jobs.length : state.jobs.filter((j) => j.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
        {!sampleJobs && (
          <button type="button" className="btn-ghost" onClick={logout}>
            로그아웃
          </button>
        )}
      </div>

      {state.kind === "loading" && (
        <p className="jobs-message" role="status">
          공고 목록을 불러오는 중입니다.
        </p>
      )}

      {state.kind === "error" && (
        <div className="jobs-message" role="alert">
          <p>공고 목록을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>
          <button type="button" className="btn-ghost" onClick={retry}>
            다시 불러오기
          </button>
        </div>
      )}

      {state.kind === "ready" && jobs.length === 0 && (
        <p className="jobs-message">
          {state.jobs.length === 0
            ? "아직 공고가 없습니다. 적재 스크립트로 공고를 넣거나 수집이 돌면 여기에 보입니다."
            : "이 상태의 공고가 없습니다."}
        </p>
      )}

      {hydrated && jobs.length > 0 && (
        <ul className="jobs-list">
          {jobs.map((job) => (
            <li key={job.id} className="job">
              <span className={`job-dday${dday(job.deadline).startsWith("D-") || dday(job.deadline) === "오늘 마감" ? " soon" : ""}`}>
                {dday(job.deadline)}
              </span>
              <div className="job-main">
                <a href={job.url} target="_blank" rel="noopener noreferrer" className="job-title">
                  {job.title} ↗
                </a>
                <p className="job-meta">
                  <strong>{job.company}</strong>
                  {[job.location, job.employment_type, job.deadline && `${job.deadline} 마감`].filter(Boolean).map((v) => (
                    <span key={v as string}> · {v}</span>
                  ))}
                </p>
                {job.memo && <p className="job-memo">{job.memo}</p>}
              </div>
              <div className="job-tags">
                <span className={statusClass[job.status]}>{statusLabel[job.status]}</span>
                {job.fit && <span className="status">{fitLabel[job.fit]}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
