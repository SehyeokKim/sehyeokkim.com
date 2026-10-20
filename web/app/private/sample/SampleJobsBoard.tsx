"use client";

import { useMemo } from "react";
import JobsBoard, { type Job } from "@/app/components/JobsBoard";
import sampleJobs from "../../../../data/sample/jobs.json";

const DAY = 86_400_000;

function toDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00`);
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 샘플 날짜를 가장 늦은 수집일이 오늘이 되도록 같은 날수만큼 옮긴다. 언제 열어도 D-day 간격이 그대로 보인다.
// 목록은 브라우저에서만 그려지므로(JobsBoard) 빌드 시점 날짜가 화면에 남지 않는다
function shiftToToday(jobs: Job[]): Job[] {
  const latest = jobs.map((j) => j.collected_at).sort().at(-1)!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = Math.round((today.getTime() - toDate(latest).getTime()) / DAY);
  const shift = (ymd: string) => toYmd(new Date(toDate(ymd).getTime() + offset * DAY));
  return jobs
    .map((j) => ({ ...j, deadline: j.deadline && shift(j.deadline), collected_at: shift(j.collected_at) }))
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")); // /api/jobs와 같은 순서, 상시는 뒤
}

export default function SampleJobsBoard() {
  const jobs = useMemo(() => shiftToToday(sampleJobs as Job[]), []);
  return <JobsBoard sampleJobs={jobs} />;
}
