// 공고 목록 · 상세가 함께 쓰는 형식과 표시 규칙. 필드는 docs/api.md의 공고 필드와 같다.

export type JobStatus = "new" | "candidate" | "applied" | "excluded";

export type Job = {
  id: string;
  company: string;
  title: string;
  url: string;
  deadline: string | null;
  location: string | null;
  employment_type: string | null;
  source: string;
  status: JobStatus;
  fit: "high" | "mid" | "low" | null;
  memo: string | null;
  collected_at: string;
  // 지원 완료로 바꿀 때 기록한다. 지원 경로는 공고 원문의 도메인 또는 company(회사 채용 페이지)
  applied_at?: string | null;
  applied_via?: string | null;
  // 화면에서만 쓰는 표시: data/sample/의 예시 공고. API로 보내거나 저장하지 않는다
  example?: boolean;
};

export const COMPANY_CHANNEL = "company";

// 원문 링크의 도메인 (www. 제외). 주소 형식이 아니면 null
export function urlHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// 지원 경로 선택지: 목록에 있는 공고들의 원문 도메인 + 회사 채용 페이지. 사이트 목록을 코드에 두지 않고 데이터에서 만든다
export function channelOptions(jobs: Job[]): string[] {
  const hosts = new Set<string>();
  for (const j of jobs) {
    const host = urlHost(j.url);
    if (host) hosts.add(host);
  }
  return [...[...hosts].sort(), COMPANY_CHANNEL];
}

export function channelLabel(id: string): string {
  return id === COMPANY_CHANNEL ? "회사 채용 페이지" : id;
}

export const statusLabel: Record<JobStatus, string> = {
  candidate: "지원 후보",
  new: "새 공고",
  applied: "지원 완료",
  excluded: "제외",
};
export const statusClass: Record<JobStatus, string> = {
  candidate: "status signal",
  new: "status",
  applied: "status ok",
  excluded: "status",
};
export const fitLabel: Record<NonNullable<Job["fit"]>, string> = { high: "적합도 상", mid: "적합도 중", low: "적합도 하" };
export const sourceLabel: Record<string, string> = { manual: "직접 추가" };

export function todayYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 오늘 날짜로 계산하므로 브라우저에서만 부른다 (빌드 시점의 정적 HTML에 남지 않게)
export function dday(deadline: string | null): string {
  if (!deadline) return "상시";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((new Date(`${deadline}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return "마감";
  return days === 0 ? "오늘 마감" : `D-${days}`;
}

export function isSoon(deadline: string | null): boolean {
  const d = dday(deadline);
  return d.startsWith("D-") || d === "오늘 마감";
}

// /api/jobs와 같은 순서: 마감일이 빠른 순, 상시 공고는 뒤
export function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
}

// 링크로 그리는 값은 http(s)만 허용한다 (javascript: 같은 주소가 href에 들어가지 않게)
export function isWebUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// 지원 완료로 바꾸고 바뀐 공고를 돌려준다. 세션이 만료됐으면 /private로 돌려보낸다
export async function applyJob(id: string, appliedVia: string): Promise<Job | null> {
  try {
    const res = await fetch(`/api/jobs/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "applied", applied_via: appliedVia }),
    });
    if (res.status === 401) {
      window.location.replace("/private/?error=expired");
      return null;
    }
    return res.ok ? ((await res.json()) as Job) : null;
  } catch {
    return null;
  }
}

// 로그인한 세션으로 공고 목록을 받는다. 세션이 없거나 만료됐으면 "expired"
export async function fetchJobs(): Promise<Job[] | "expired" | "error"> {
  try {
    const res = await fetch("/api/jobs", { credentials: "same-origin", cache: "no-store" });
    if (res.status === 401) return "expired";
    if (!res.ok) return "error";
    return (await res.json()).items as Job[];
  } catch {
    return "error";
  }
}

export const LOGIN_EXPIRED = "/private/?error=expired";
