"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  type Job,
  type EmploymentFilter,
  type Fit,
  type JobStatus,
  LOGIN_EXPIRED,
  dday,
  employmentFilters,
  matchesEmployment,
  roleArea,
  roleAreaNames,
  fetchJobs,
  fitCriteria,
  fitLabel,
  isSoon,
  statusClass,
  sortJobs,
  statusLabel,
  urlHost,
  visibleJobs,
} from "./jobs";
import { sampleJobs } from "./sampleJobs";

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; jobs: Job[] };

const filters: (JobStatus | "all")[] = ["all", "candidate", "new", "applied", "excluded"];
const fitFilters: (Fit | "all")[] = ["all", "high", "mid", "low"];

const noSubscribe = () => () => {};

// 로그인한 본인의 공고 목록. sample이면 API를 부르지 않고 예시 공고(sampleJobs)만 그린다.
// 공고를 누르면 상세 페이지(?id=)로 간다. 정적 사이트라 공고별 페이지를 빌드 때 만들 수 없기 때문
export default function JobsBoard({ sample = false }: { sample?: boolean }) {
  const [live, setLive] = useState<State>({ kind: "loading" });
  const sampleList = useSyncExternalStore(sampleJobs.subscribe, sampleJobs.getSnapshot, sampleJobs.getServerSnapshot);
  const base: State = sample ? { kind: "ready", jobs: sampleList } : live;
  // D-day는 오늘 날짜로 계산하므로 빌드 시점의 정적 HTML에는 목록을 넣지 않고 브라우저에서만 그린다
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  // 마감 여부와 정렬도 오늘 날짜에 달려 있어 브라우저에서만 적용한다 (빌드 때의 정적 HTML과 어긋나지 않게)
  const state: State =
    base.kind === "ready" && hydrated ? { kind: "ready", jobs: sortJobs(visibleJobs(base.jobs)) } : base;
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [fitFilter, setFitFilter] = useState<(typeof fitFilters)[number]>("all");
  const [employment, setEmployment] = useState<EmploymentFilter | "all">("all");
  const [area, setArea] = useState<string>("all");
  const detailHref = sample ? "/private/sample/detail/" : "/private/jobs/detail/";

  const load = useCallback(() => {
    fetchJobs().then((result) => {
      if (result === "expired") window.location.replace(LOGIN_EXPIRED);
      else setLive(result === "error" ? { kind: "error" } : { kind: "ready", jobs: result });
    });
  }, []);

  useEffect(() => {
    if (!sample) load();
  }, [load, sample]);

  function retry() {
    setLive({ kind: "loading" });
    load();
  }

  const jobs =
    state.kind === "ready"
      ? state.jobs.filter(
          (j) =>
            (filter === "all" || j.status === filter) &&
            (fitFilter === "all" || j.fit === fitFilter) &&
            (employment === "all" || matchesEmployment(j, employment)) &&
            (area === "all" || roleArea(j) === area),
        )
      : [];

  return (
    <>
      <div className="jobs-toolbar">
        {/* 조건(상태 · 적합도 · 직무 분야 · 고용형태)은 모두 드롭다운으로 한 줄에 모은다 */}
        <div className="jobs-subfilters">
          <select
            className="jobs-select"
            aria-label="상태로 거르기"
            value={filter}
            onChange={(e) => setFilter(e.target.value as (typeof filters)[number])}
          >
            {filters.map((f) => (
              <option key={f} value={f}>
                {`${f === "all" ? "상태 전체" : statusLabel[f]} (${
                  state.kind === "ready" ? (f === "all" ? state.jobs : state.jobs.filter((j) => j.status === f)).length : 0
                })`}
              </option>
            ))}
          </select>
          <select
            className="jobs-select"
            aria-label="적합도로 거르기"
            value={fitFilter}
            onChange={(e) => setFitFilter(e.target.value as (typeof fitFilters)[number])}
          >
            {fitFilters.map((f) => (
              <option key={f} value={f}>
                {f === "all"
                  ? "적합도 전체"
                  : `${fitLabel[f]} (${state.kind === "ready" ? state.jobs.filter((j) => j.fit === f).length : 0})`}
              </option>
            ))}
          </select>
          <select className="jobs-select" aria-label="직무 분야로 거르기" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="all">직무 분야 전체</option>
            {roleAreaNames.map((name) => (
              <option key={name} value={name}>
                {name} ({state.kind === "ready" ? state.jobs.filter((j) => roleArea(j) === name).length : 0})
              </option>
            ))}
          </select>
          <select
            className="jobs-select"
            aria-label="고용형태로 거르기"
            value={employment}
            onChange={(e) => setEmployment(e.target.value as EmploymentFilter | "all")}
          >
            <option value="all">고용형태 전체</option>
            {[...employmentFilters, "미확인" as const].map((f) => (
              <option key={f} value={f}>
                {f} ({state.kind === "ready" ? state.jobs.filter((j) => matchesEmployment(j, f)).length : 0})
              </option>
            ))}
          </select>
        </div>
      </div>
      <details className="jobs-fit-legend">
        <summary>적합도 기준</summary>
        <dl>
          {fitCriteria.map((c) => (
            <div key={c.fit}>
              <dt>{c.label}</dt>
              <dd>{c.text}</dd>
            </div>
          ))}
        </dl>
      </details>

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
              <span className={isSoon(job.deadline) ? "job-dday soon" : "job-dday"}>{dday(job.deadline)}</span>
              <div className="job-main">
                <Link href={`${detailHref}?id=${encodeURIComponent(job.id)}`} className="job-open">
                  <span className="job-title">
                    {job.title} <span aria-hidden="true">›</span>
                  </span>
                  <span className="job-meta">
                    <strong>{job.company}</strong>
                    {[urlHost(job.url), job.location, job.employment_type, job.deadline && `${job.deadline} 마감`]
                      .filter(Boolean)
                      .map((v) => (
                        <span key={v as string}> · {v}</span>
                      ))}
                  </span>
                </Link>
                {(job.role || job.career || job.salary) && (
                  <p className="job-sub">{[job.role, job.career, job.salary].filter(Boolean).join(" · ")}</p>
                )}
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
