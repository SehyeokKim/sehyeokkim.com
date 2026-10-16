// 공개 이력서 내용. 화면 코드와 분리해 문구만 이 파일에서 고친다.
// 사실은 비공개 프로필 원본 기준이며, 원본에 없는 경력 · 수치는 쓰지 않는다.
// 연락처는 공개용만 둔다. 전화번호 · 주소 · 생년월일 · 병역 등은 넣지 않는다.
import type { IconName } from "./icons";

// 문장 안의 **굵게** 표시는 화면에서 강조로 바뀐다.

export type Project = {
  slug: string; // 목차 이동용 id (영문)
  name: string; // 짧은 이름 (타임라인 · 목록용)
  tagline: string; // 한 줄 설명
  period: string;
  summary: string;
  role: string;
  team: string;
  stack: string[];
  highlights: string[];
  links?: { label: string; href: string }[];
  // 카드의 "자세히 보기"를 누르면 뜨는 상세 창의 내용. 항목이 빈 섹션은 배포 화면에 나오지 않는다
  details?: { title: string; items: string[] }[];
};

export type Credential = {
  title: string;
  issuer: string;
  date: string;
  note?: string;
};

// level은 1–5 자기 평가. 정하지 않으면(undefined) 화면에 별을 표시하지 않는다
export type Skill = {
  name: string;
  detail?: string;
  icon?: IconName;
  level?: 1 | 2 | 3 | 4 | 5;
};

export const profile = {
  name: "김세혁",
  nameEn: "Sehyeok Kim", // 비어 있으면 표시하지 않는다
  role: "Full-stack · DevOps Engineer",
  headline: "AI가 일하게 하되, 사람이 승인하고 책임질 수 있게 설계하는 **휴먼 인 더 루프** 엔지니어",
  // 소개: 자기소개서 흐름 — 목표를 위해 해 온 것 / 일할 때의 마음가짐 / 하고 싶은 일.
  // 기술 이름 · 수치 같은 세부 내용은 프로젝트 상세에 두고, 여기서는 큰 줄기만 쓴다
  intro: [
    "저는 서비스가 **멈추지 않도록 시스템을 설계하고, 문제가 생겨도 빠르게 되돌릴 수 있게 유지보수하는 일**을 바라보며 준비해 왔습니다. 컴퓨터공학을 전공하며 KISA 침해사고 대응훈련으로 보안의 기초를 익혔고, 졸업 후에는 인공지능사관학교 클라우드 · 인프라 과정에서 AWS를 직접 다루고 있습니다.",
    "팀 프로젝트에서는 초기에 **개발 환경과 CI · 배포 흐름을 갖추는 역할**을 맡아 왔습니다. 4인 팀의 팀장으로서 Git · 코드리뷰 · CI 규칙을 먼저 정해 팀이 같은 방식으로 일하게 했고, 혼자 만든 서비스는 직접 배포해 지금도 운영하고 있습니다. 보고 계신 이 사이트도 AWS 위에 직접 설계하고 배포했습니다.",
    "자동화를 할 때는 얼마나 빠른지보다 **잘못됐을 때 되돌릴 수 있는지, 사람이 확인하고 판단할 수 있는지**를 먼저 생각합니다. 그래서 AI가 제안한 조치도 바로 실행하지 않고 검증과 승인을 거치게 했고, 실패하면 원래 상태로 돌아가도록 설계했습니다. 결정한 이유는 글로 남겨 팀원 누구나 알 수 있게 하고, AI 도구가 낸 결과도 근거를 확인한 뒤에 반영합니다.",
    "앞으로는 실제 사용자가 있는 서비스에서 **배포부터 모니터링, 장애 대응까지** 맡아, 서비스가 안정적으로 돌아가도록 꾸준히 다듬어 가고 싶습니다. 특히 AI가 들어간 서비스는 판단이 틀릴 수도 있는 만큼, 사람이 믿고 맡길 수 있게 운영하는 일에 힘을 보태고 싶습니다.",
  ],
  email: "kimseh0418@gmail.com", // 공개용 연락처. 비우면 화면에 표시하지 않는다
  github: "https://github.com/SehyeokKim",
};

export const skills: { category: string; items: Skill[] }[] = [
  {
    category: "Language",
    items: [{ name: "Python", icon: "python", detail: "Boto3 자동화 · 운영 스크립트" }, { name: "TypeScript", icon: "typescript" }, { name: "C / C++", icon: "cplusplus" }],
  },
  {
    category: "Cloud · Infra",
    items: [
      { name: "AWS", icon: "aws", detail: "EC2 · VPC · ALB · ECS Fargate · RDS · IAM · WAF · CloudWatch" },
      { name: "Docker / Compose", icon: "docker" },
      { name: "LocalStack", icon: "localstack" },
      { name: "GitHub Actions CI", icon: "githubactions" },
    ],
  },
  {
    category: "Backend · DB",
    items: [{ name: "FastAPI", icon: "fastapi" }, { name: "PostgreSQL", icon: "postgresql" }, { name: "SQLAlchemy · Alembic", icon: "database" }, { name: "Supabase", icon: "supabase" }],
  },
  {
    category: "AI · Security",
    items: [
      { name: "AI 조치 4단계 가드레일 설계", icon: "guardrail" },
      { name: "최소 권한 IAM 설계", icon: "iam" },
      { name: "Claude Code 활용 개발 · 리뷰", icon: "claude", detail: "판단 근거 교차 검증" },
      { name: "악성 문서파일 분석 · 침해사고 대응", icon: "forensics", detail: "KISA" },
    ],
  },
];

// 상세 펼치기 섹션 틀 (이력서 작성 지침의 [내 역할(책임)] · [위험 대처] 기준). 내용은 원본 확인 후 채운다
const detailSections = (): NonNullable<Project["details"]> => [
  { title: "내 역할(책임)", items: [] },
  { title: "위험 대처", items: [] },
  { title: "구조 · 동작 방식", items: [] },
  { title: "트러블슈팅 · 배운 점", items: [] },
];

export const projects: Project[] = [
  {
    slug: "vigilantis",
    name: "Vigilantis",
    tagline: "AWS FinSecOps 자율 관제 · 조치 플랫폼",
    period: "2026.08–진행 중",
    summary:
      "AWS 자산과 보안 위협을 24시간 관제하고, AI가 제안한 조치를 검증한 뒤 실행하며 실패하면 자동으로 원복합니다.",
    role: "팀장(PM) · Infra & DevSecOps",
    team: "4인 팀 · 인공지능사관학교",
    stack: ["Python", "FastAPI", "Boto3", "AWS", "PostgreSQL", "Docker", "LocalStack", "GitHub Actions", "Next.js"],
    highlights: [
      "AI 제안 조치를 **4단계 가드레일**(스키마 · 허용 목록 · 대상 ARN 일치 · AWS Dry-Run)로 검증하고, 위험 조치는 **사람 승인 후 실행**",
      "Boto3 조치 엔진: 조치 직전 스펙 백업 → Status Check 감시 → 실패 시 **자동 원복(40초 이내)**, MVP 테스트 기준 **조치 성공률 100%**",
      "실 AWS 검증에서 Dry-Run 동작에 대한 설계 가정의 오류를 실측으로 발견, 최소 권한 IAM(리전 · 태그 · VPC 제한) 적용으로 **권한 누락 0건**",
      "Git 컨벤션 · 코드리뷰 · CI 규칙을 먼저 세우고, **AI 커밋 서명 검사 CI**와 팀 공통 AI 작업 규칙으로 최종 판단은 사람이 하도록 통일",
      "팀원 역량에 맞춰 일일 업무를 배정하고, 설계 결정 **9건을 ADR로 기록**해 결정 이유를 팀 전체가 공유",
    ],
    details: detailSections(),
    links: [{ label: "GitHub", href: "https://github.com/ProjectVigilantis/vigilantis" }],
  },
  {
    slug: "agetrust",
    name: "AgeTrust",
    tagline: "얼굴인식 · DID/VC 기반 제로트러스트 성인인증",
    period: "2026.08–진행 중",
    summary: "편의점 · 주점의 위조 신분증 문제에 대응해, 개인정보 노출 없이 성인 여부만 증명하는 키오스크 인증입니다.",
    role: "PM · INFRA-BE",
    team: "4인 팀",
    stack: ["Python", "FastAPI", "PostgreSQL", "Kafka", "Docker", "Alembic", "GitHub Actions", "W3C DID/VC"],
    highlights: [
      "**FastAPI 백엔드 초기 구조**(API v1 라우팅, JWT 인증 미들웨어, 모델 · 스키마 계층)와 Alembic 마이그레이션 구성",
      "**해시 체인 기반 감사 로그**와 관리자 조회 API, 인증 전 구간 감사 이벤트 연동",
      "전화번호 중복 · 동시 가입 **경쟁 상태를 DB 제약으로 처리(409)**하고 회귀 테스트 추가",
      "**GitHub Actions CI**(린트 · 테스트 · E2E)와 성인 인증 E2E 통합 테스트",
    ],
    details: detailSections(),
    links: [{ label: "GitHub", href: "https://github.com/ZeroTurst-NoneBelieve/agetrust-backend" }],
  },
  {
    slug: "our-date-map",
    name: "Our Date Map",
    tagline: "커플 데이트 기록 · 계획 PWA",
    period: "2026.07–2026.09",
    summary: "앱스토어 비용 · 재설치 문제를 피하려 PWA로 개발해, 유지비 0원으로 실사용 중인 개인 서비스입니다.",
    role: "기획 · 개발 · 배포",
    team: "개인 프로젝트",
    stack: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS", "Supabase", "Vercel"],
    highlights: [
      "Supabase(PostgreSQL · Auth · Storage)와 **RLS**로 연결된 커플만 데이터에 접근",
      "Service Worker · **Web Push(VAPID)**로 iOS 홈 화면 앱 푸시",
      "클라이언트 이미지 압축(300KB)과 **다층 캐싱**으로 지도 · 경로 API 호출 절감",
      "커밋 100건, DB 마이그레이션 21건, **약 한 달 만에 Vercel 배포 · 운영**",
    ],
    details: detailSections(),
    links: [
      { label: "GitHub", href: "https://github.com/SehyeokKim/our-date-map" },
      { label: "서비스", href: "https://our-date-map.vercel.app" },
    ],
  },
  {
    slug: "smart-doorlock",
    name: "스마트 도어락 CCTV",
    tagline: "AI 이상행동 탐지 · 캡스톤디자인 졸업작품",
    period: "2025.03–2025.12",
    summary:
      "Raspberry Pi 카메라 영상을 실시간 스트리밍하고 폭행 · 납치 등 이상행동을 탐지합니다. 최종 평가 A+.",
    role: "백엔드",
    team: "3인 팀",
    stack: ["Python", "FastAPI", "WebRTC", "MQTT", "Docker", "Raspberry Pi"],
    highlights: [
      "프론트 · AI · 기기 간 **API 계약 설계**, FastAPI REST API와 JWT 인증 · 인가, DB 스키마 설계",
      "SRS 미디어 서버로 **RTMP → WebRTC 실시간 스트리밍**, MQTT 도어락 원격 제어",
      "**Docker Compose**로 API · WebRTC · AI 분석 · MQTT 브로커 일괄 배포",
    ],
    details: detailSections(),
    links: [{ label: "GitHub", href: "https://github.com/jnucpe20/server-public" }],
  },
];

// 최근 순서 (진행 중 → 종료일이 늦은 순)
export const education: Credential[] = [
  { title: "인공지능사관학교 7기 AI보안(클라우드 및 인프라) 과정", issuer: "광주 인공지능사관학교", date: "2026.05–수강 중" },
  { title: "컴퓨터공학과 학사", issuer: "전남대학교", date: "2020.03–2026.02", note: "학점 3.11/4.5" },
  { title: "호남권 정보보호 특별과정", issuer: "한국인터넷진흥원(KISA)", date: "2025.08" },
  { title: "침해사고 대응훈련 — 악성 문서파일 분석(HWP, MS Office)", issuer: "한국인터넷진흥원(KISA)", date: "2025.08" },
];

// 최근 순서
export const certifications: Credential[] = [
  { title: "AWS Certified AI Practitioner", issuer: "AWS", date: "2026.09", note: "AIF-C01" },
  { title: "TOEIC 655", issuer: "", date: "2026.03" },
  { title: "TRIZ 1수준", issuer: "한국트리즈협회", date: "2024.10", note: "창의적 문제해결" },
];

export const site = {
  url: "https://sehyeokkim.com", // 대표 주소 (cloudfront.net 주소로도 열리지만 검색 · 공유는 이 주소로 통일)
  repository: "https://github.com/SehyeokKim/sehyeokkim.com",
};
