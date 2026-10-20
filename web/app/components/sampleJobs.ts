// 예시 공고(가짜 데이터). 샘플 화면(/private/sample)에서는 이것만, 로그인한 실제 목록에서는 내 공고와 함께 "예시"로 보인다.
// 브라우저 메모리에만 두므로 상태를 바꿔도 저장되지 않고,
// 페이지를 새로고침하면 처음으로 돌아간다. 화면 사이를 오갈 때(Next.js Link)는 바꾼 상태가 유지된다.
import sampleData from "../../../data/sample/jobs.json";
import { type Job, sortJobs } from "./jobs";

const DAY = 86_400_000;

function toDate(ymd: string): Date {
  return new Date(`${ymd}T00:00:00`);
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 가장 늦은 수집일이 오늘이 되도록 모든 날짜를 같은 날수만큼 옮긴다. 언제 열어도 D-day 간격이 그대로 보인다
function shiftToToday(jobs: Job[]): Job[] {
  const latest = jobs.map((j) => j.collected_at).sort().at(-1)!;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = Math.round((today.getTime() - toDate(latest).getTime()) / DAY);
  const shift = (ymd: string) => toYmd(new Date(toDate(ymd).getTime() + offset * DAY));
  return jobs.map((j) => ({
    ...j,
    deadline: j.deadline && shift(j.deadline),
    collected_at: shift(j.collected_at),
    applied_at: j.applied_at && shift(j.applied_at),
  }));
}

const initial = sortJobs((sampleData as Job[]).map((j) => ({ ...j, example: true })));
let current: Job[] | null = null;
const listeners = new Set<() => void>();

// useSyncExternalStore로 읽는다. 서버(빌드) 값은 날짜를 옮기기 전 원본이고, 날짜가 보이는 부분은 브라우저에서만 그린다
export const sampleJobs = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot(): Job[] {
    current ??= shiftToToday(initial);
    return current;
  },
  getServerSnapshot(): Job[] {
    return initial;
  },
  update(id: string, patch: Partial<Job>) {
    current = sampleJobs.getSnapshot().map((j) => (j.id === id ? { ...j, ...patch } : j));
    listeners.forEach((l) => l());
  },
};
