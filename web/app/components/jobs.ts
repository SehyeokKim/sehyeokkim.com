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
  // 직무 · 지원 자격 · 연봉 조건(출처 포함 짧은 값). 예시 공고에는 없을 수 있다
  role?: string | null;
  career?: string | null;
  salary?: string | null;
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
export type Fit = NonNullable<Job["fit"]>;

// 적합도는 사람이 이 기준으로 매긴다. 목록 위 범례로 보여 준다
export const fitCriteria: { fit: Fit; label: string; text: string }[] = [
  {
    fit: "high",
    label: "상",
    text: "희망 직무의 핵심(AI 서비스 백엔드 · 에이전트 · AI 인프라 · 클라우드 · DevOps)이고, Python · Docker · AWS · LLM 요건이 경험과 직접 맞으며, 신입 지원이 가능하고 걸리는 필수 자격이 없음",
  },
  { fit: "mid", label: "중", text: "직무는 맞지만 스택 · 요건이 일부만 맞거나, 상세 요건을 확인하지 못함" },
  { fit: "low", label: "하", text: "희망 직무와 거리가 있거나, 경력 · 학위 요건이 걸리거나, 체험형 인턴" },
];

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

// 마감 전 공고는 마감이 빠른 순, 그다음 상시, 마감이 지난 공고는 맨 뒤 (늦게 지난 것부터)
export function sortJobs(jobs: Job[]): Job[] {
  const today = todayYmd();
  const rank = (j: Job) => (j.deadline === null ? 1 : j.deadline < today ? 2 : 0);
  return [...jobs].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (rank(a) === 2) return b.deadline!.localeCompare(a.deadline!);
    return (a.deadline ?? "").localeCompare(b.deadline ?? "");
  });
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
