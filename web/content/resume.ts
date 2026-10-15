// 공개 이력서 내용. 화면 코드와 분리해 문구만 이 파일에서 고친다.
// TODO 표시는 아직 확정되지 않은 자리표시자다. 직접 확인한 문구로만 바꾼다.

export type Project = {
  title: string;
  period: string;
  summary: string;
  role: string;
  stack: string[];
  highlights: string[];
  links?: { label: string; href: string }[];
};

export type Credential = {
  title: string;
  issuer: string;
  date: string;
};

// level은 1–5 자기 평가. 정하지 않으면(undefined) 화면에 별을 표시하지 않는다
export type Skill = {
  name: string;
  level?: 1 | 2 | 3 | 4 | 5;
};

export const profile = {
  name: "김세혁",
  nameEn: "", // 영문 이름 표기를 정하면 입력. 비어 있으면 표시하지 않는다
  role: "Cloud · Infrastructure",
  headline: "TODO: 한 줄 소개 (예: 지원 직무와 강점)",
  intro: [
    "TODO: 소개 문단 1",
    "TODO: 소개 문단 2",
  ],
  email: "", // 공개용 이메일을 정하면 입력. 비어 있으면 화면에 표시하지 않는다
  github: "https://github.com/SehyeokKim",
};

export const skills: { category: string; items: Skill[] }[] = [
  { category: "Cloud · Infra", items: [{ name: "TODO" }] },
  { category: "IaC · CI/CD", items: [{ name: "TODO" }] },
  { category: "Language", items: [{ name: "TODO" }] },
  { category: "Etc", items: [{ name: "TODO" }] },
];

export const projects: Project[] = [1, 2, 3, 4].map((n) => ({
  title: `TODO: 프로젝트 ${n}`,
  period: "TODO: 기간",
  summary: "TODO: 한두 줄 요약",
  role: "TODO: 맡은 역할",
  stack: ["TODO"],
  highlights: ["TODO: 문제 → 해결 → 결과"],
}));

export const education: Credential[] = [
  { title: "TODO: 학교 · 전공", issuer: "", date: "TODO" },
];

export const certifications: Credential[] = [
  { title: "TODO: 자격증", issuer: "TODO: 발급 기관", date: "TODO" },
];

export const site = {
  repository: "https://github.com/SehyeokKim/sehyeokkim.com",
};
