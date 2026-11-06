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
  // 카드를 누르면 뜨는 상세 창의 내용. 항목이 빈 섹션은 배포 화면에 나오지 않는다
  details?: { title: string; items: string[] }[];
  diagram?: Diagram; // 상세 창의 구성도
  // 상세 창의 화면 캡처. 파일은 web/public/images/projects/{slug}/. phone은 세로 모바일 화면(가로로 나란히 놓는다)
  shots?: { src: string; caption: string; phone?: boolean }[];
};

// 구성도: 열(col) · 행(row) 격자에 상자를 놓으면 좌표와 선은 ProjectDiagram이 계산한다
export type DiagramNode = { id: string; label: string; sub?: string; col: number; row: number };
export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  kind?: "data" | "approval" | "deploy"; // approval: 사람 승인 단계
  route?: "vh" | "over"; // 기본은 가로 → 세로 → 가로. vh는 세로로 먼저 꺾고, over는 위쪽 빈 줄로 돌아간다
  offset?: number; // 같은 두 상자 사이 선이 겹칠 때 옆으로 비키는 거리(px)
  bend?: number; // 열 사이 세로 구간을 옆으로 미는 거리(px)
};
export type Diagram = {
  groups: { label: string; col: [number, number]; row: [number, number] }[];
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  steps: string[]; // 구성도 아래 번호 붙은 흐름 설명
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
  // 소개: 자기소개서 흐름(목표를 위해 해 온 것 / 일할 때의 마음가짐 / 하고 싶은 일).
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

export const projects: Project[] = [
  {
    slug: "vigilantis",
    name: "Vigilantis",
    tagline: "AWS FinSecOps 자율 관제 · 조치 플랫폼",
    period: "2026.08–진행 중",
    summary:
      "고객사 AWS 계정의 자산과 보안 위협을 24시간 관제하고, AI가 제안한 조치를 검증한 뒤 실행하며 실패하면 자동으로 원복하는 SaaS형 플랫폼입니다.",
    role: "팀장(PM) · Infra & DevSecOps",
    team: "4인 팀 · 인공지능사관학교",
    stack: ["Python", "FastAPI", "Boto3", "AWS", "ECS Fargate", "PostgreSQL", "Docker", "LocalStack", "GitHub Actions", "Next.js"],
    highlights: [
      "AI 제안 조치를 **4단계 가드레일**(스키마 · 허용 목록 · 대상 ARN 일치 · AWS Dry-Run)로 검증하고, 위험 조치는 **사람 승인 후 실행**",
      "Boto3 조치 엔진: 조치 직전 스펙 백업 → Status Check 감시 → 실패 시 **자동 원복(40초 이내)**, MVP 테스트 기준 **조치 성공률 100%**",
      "실 AWS 검증에서 Dry-Run 동작에 대한 설계 가정의 오류를 실측으로 발견, 최소 권한 IAM(리전 · 태그 · VPC 제한) 적용으로 **권한 누락 0건**",
      "**플랫폼 · 고객 계정 분리 배포**(CloudFront + WAF · ALB · ECS Fargate · RDS), 고객 계정은 장기 키 없이 AssumeRole + ExternalId로만 접근",
      "Git 컨벤션 · 코드리뷰 · CI 규칙을 먼저 세우고, **AI 커밋 서명 검사 CI**와 팀 공통 AI 작업 규칙으로 최종 판단은 사람이 하도록 통일",
      "팀원 역량에 맞춰 일일 업무를 배정하고, 설계 결정 **9건을 ADR로 기록**해 결정 이유를 팀 전체가 공유",
    ],
    details: [
      {
        title: "내 역할(책임)",
        items: [
          "4인 팀 PM으로 프로젝트 현황 문서를 주 2회 갱신하고, 일일 업무 배정과 **PR 기본 리뷰** 담당",
          "**Boto3 조치 실행 엔진**의 스펙 백업 · 원복과 보안 그룹 규칙 삭제 · EC2 격리 실행 경로 구현",
          "**플랫폼 배포 스크립트**로 CloudFront + WAF, ALB, ECS Fargate, RDS를 태그 기반으로 반복 실행해도 같은 결과가 나오게 구성",
          "Next.js 대시보드를 맡아 랜딩 · 고객 관리 · 통합 관제 화면까지 확장",
        ],
      },
      {
        title: "위험 대처",
        items: [
          "AI 추천은 **4단계 가드레일**을 모두 통과해야 제안으로 저장되고, 마지막 단계인 Dry-Run 호출 규약은 ADR로 확정",
          "조치 직전 **스펙을 JSON으로 백업**하고 Status Check가 실패하면 자동 원복, 결과를 확인할 수 없으면 확인 불가 상태로 보류",
          "고객 계정의 접근 역할은 **태그로 소유 플랫폼을 확인**하고, 다른 플랫폼 태그가 있거나 태그가 없으면 덮어쓰지 않고 중단",
          "비용 조회 권한을 리전 조건이 다른 **별도 정책으로 분리**하고, 코드가 부르는 API와 정책이 맞는지 테스트로 대조",
        ],
      },
      {
        title: "구조 · 동작 방식",
        items: [
          "플랫폼 계정과 고객 계정을 분리하고, 고객이 만든 역할에 **AssumeRole + ExternalId**로만 진입",
          "FastAPI 백엔드 하나에서 수집, 규칙 판정, AI 분석 · 가드레일, 승인, 실행 · 원복을 처리하고 결과는 WebSocket으로 화면에 반영",
          "외부에 열린 경로는 CloudFront + WAF뿐이고, ALB는 CloudFront에서 온 요청만 HTTPS로 수신",
          "RDS 자동 백업 7일, CloudWatch 오류 알람 4종을 SNS 메일로 수신",
        ],
      },
      {
        title: "트러블슈팅 · 배운 점",
        items: [
          "실 AWS 점검에서 **존재하지 않는 인스턴스의 다운사이징 Dry-Run도 통과하는 것**을 확인해 설계 가정을 바로잡음",
          "실행 전용 IAM 사용자로 점검해 **권한 누락 0건**, VPC 밖 보안 그룹 생성이 막히는 것으로 정책 울타리 동작 확인",
          "새 계정 첫 배포가 WAF IP 집합 전파 지연으로 멈춘 원인을 **CloudTrail로 추적**하고 재실행으로 복구",
          "권한 없이 비용 API가 CI를 통과하던 빈틈을 찾아 **IAM 정책 대조 테스트**로 막음",
        ],
      },
    ],
    diagram: {
      groups: [
        { label: "사용자", col: [0, 0], row: [1, 1] },
        { label: "Vigilantis 플랫폼 계정", col: [1, 3], row: [0, 2] },
        { label: "외부 AI", col: [4, 4], row: [0, 0] },
        { label: "고객사 AWS 계정", col: [4, 4], row: [1, 2] },
      ],
      nodes: [
        { id: "browser", label: "브라우저", sub: "관제 담당자", col: 0, row: 1 },
        { id: "cf", label: "CloudFront + WAF", sub: "HTTPS · 속도 제한", col: 1, row: 1 },
        { id: "alb", label: "ALB", sub: "CloudFront 요청만", col: 2, row: 1 },
        { id: "notify", label: "SNS · Slack", sub: "위협 · 운영 알림", col: 2, row: 2 },
        { id: "web", label: "ECS web", sub: "Next.js 대시보드", col: 3, row: 0 },
        { id: "api", label: "ECS api", sub: "수집 · 판정 · 가드레일 · 실행", col: 3, row: 1 },
        { id: "rds", label: "RDS PostgreSQL", sub: "테넌트별 기록", col: 3, row: 2 },
        { id: "ai", label: "OpenAI API", sub: "근거 요약 · 조치 추천", col: 4, row: 0 },
        { id: "role", label: "vigilantis-access", sub: "IAM 역할 · ExternalId", col: 4, row: 1 },
        { id: "assets", label: "EC2 · 보안 그룹 · EBS", sub: "관제 · 조치 대상", col: 4, row: 2 },
      ],
      edges: [
        { from: "browser", to: "cf", label: "HTTPS" },
        { from: "cf", to: "alb" },
        { from: "alb", to: "web" },
        { from: "alb", to: "api", label: "/api" },
        { from: "browser", to: "api", label: "조치 승인", kind: "approval", route: "over" },
        { from: "api", to: "rds" },
        { from: "api", to: "ai", offset: -10 },
        { from: "api", to: "role", label: "AssumeRole", offset: 6 },
        { from: "role", to: "assets", label: "조회 · Dry-Run · 조치" },
        { from: "api", to: "notify", label: "알림", offset: 12 },
      ],
      steps: [
        "고객사가 온보딩 안내의 CloudFormation으로 자기 계정에 **vigilantis-access 역할**을 만듭니다.",
        "플랫폼 api가 장기 키 없이 **AssumeRole + ExternalId**로 들어가 자산과 CloudWatch 지표를 주기적으로 모으고, 규칙 엔진이 후보를 고릅니다.",
        "근거를 OpenAI로 보내 요약과 추천 조치를 받고, 추천은 **스키마 · 허용 목록 · ARN 일치 · Dry-Run**을 모두 통과해야 제안으로 저장됩니다.",
        "관제 담당자가 화면에서 **승인하면** 같은 역할로 조치를 실행하고, Status Check가 실패하면 백업한 스펙으로 되돌립니다.",
      ],
    },
    shots: [
      { src: "/images/projects/vigilantis/landing.webp", caption: "서비스 소개 랜딩 페이지" },
      { src: "/images/projects/vigilantis/dashboard.webp", caption: "고객사 대시보드: 관제 자산 · 절감 가능액 · 위협 이벤트" },
      { src: "/images/projects/vigilantis/incident.webp", caption: "AI 판단 근거와 예상 절감액이 붙은 조치 제안" },
      { src: "/images/projects/vigilantis/rollback.webp", caption: "조치 후 상태 확인에 실패해 이전 스펙으로 자동 복원된 기록" },
    ],
    links: [{ label: "GitHub", href: "https://github.com/ProjectVigilantis/vigilantis" }],
  },
  {
    slug: "agetrust",
    name: "AgeTrust",
    tagline: "얼굴인식 · DID/VC 기반 제로트러스트 성인인증",
    period: "2026.08–2026.10",
    summary: "편의점 · 주점의 위조 신분증 문제에 대응해, 개인정보 노출 없이 성인 여부만 증명하는 키오스크 인증입니다.",
    role: "PM · INFRA-BE",
    team: "4인 팀",
    stack: ["Python", "FastAPI", "PostgreSQL", "Kafka", "Docker", "Alembic", "GitHub Actions", "W3C DID/VC"],
    highlights: [
      "설계 결정 **16건을 ADR로 기록**하고 시스템 개요 · 인증 흐름 · API 명세 · DB 설계 문서 작성",
      "**FastAPI 백엔드 초기 구조**(API v1 라우팅 · 설정 · DB 연결)와 검증 흐름 개정 Alembic 마이그레이션",
      "**해시 체인 기반 감사 로그**와 관리자 조회 API, 인증 전 구간 감사 이벤트 연동",
      "전화번호 중복 · 동시 가입 **경쟁 상태를 DB 제약으로 처리(409)**하고 회귀 테스트 추가",
      "**GitHub Actions CI**(린트 · 테스트 · E2E)와 성인 인증 E2E 통합 테스트",
    ],
    details: [
      {
        title: "내 역할(책임)",
        items: [
          "시스템 설계 결정 **16건을 ADR로 기록**하고 시스템 개요 · 인증 흐름 · API 명세 · DB 설계 문서 작성",
          "백엔드 초기 디렉터리 구조와 API v1 라우터 구성, dev에서 main으로의 릴리스 관리",
          "**해시 체인 감사 로그**와 관리자용 로그 조회 · 무결성 검증 API 구현",
          "멈춰 있던 팀원의 마이그레이션 PR을 이어받아 ADR이 요구한 컬럼까지 반영해 마무리",
        ],
      },
      {
        title: "위험 대처",
        items: [
          "직전 기록의 해시를 포함하는 SHA-256 체인과 **처음 깨진 지점을 알려 주는 검증 API**로 감사 기록 조작 탐지",
          "동시에 기록할 때 체인이 갈라지지 않게 DB advisory lock으로 순서를 잡고, 로그인 실패 이력은 예외 전에 먼저 저장",
          "감사 로그에서 OTP · 비밀번호 · VC 본문을 빼고 전화번호는 마스킹, 실패 사유를 한 코드로 묶어 **계정 존재 여부 노출 차단**",
          "키오스크 nonce는 해시로 저장하고 중복 검사 범위를 키오스크 단위로 조정",
        ],
      },
      {
        title: "구조 · 동작 방식",
        items: [
          "얼굴 대조는 키오스크에서 하고 **신분증 · 얼굴 원본과 임베딩은 서버에 저장하지 않는** 신뢰 경계 설계",
          "키오스크가 QR로 챌린지를 주고 폰이 BLE로 VP를 보내 **서버 호출 없이 현장에서 검증**하는 구조",
          "판정 결과만 HTTPS로 기록하고, 감사 이벤트는 outbox를 거쳐 Kafka로 발행",
          "오류 응답 형식을 하나로 통일하고 보호된 엔드포인트 8개의 401 · 403을 API 문서에 명시",
        ],
      },
      {
        title: "트러블슈팅 · 배운 점",
        items: [
          "코드 변경 없이 깨진 CI의 원인을 간접 의존성에서 찾아 **전이 의존성까지 버전 고정**",
          "가짜 세션 테스트가 놓치던 조회 조건을 실제 PostgreSQL 테스트로 보강해, 일부러 고장 낸 12가지 중 기존 테스트가 놓친 10가지까지 검출",
          "가입 버튼을 두 번 눌러 동시에 들어온 요청이 500을 내던 문제를 **DB 제약 위반 처리로 409 통일**",
          "데이터를 조용히 지우는 대신 실패해서 사람이 확인하게 만든 마이그레이션의 의도와 복구 절차를 문서로 기록",
        ],
      },
    ],
    diagram: {
      groups: [
        { label: "사용자 폰", col: [0, 0], row: [0, 0] },
        { label: "매장 키오스크", col: [1, 1], row: [0, 0] },
        { label: "관리자", col: [3, 3], row: [0, 0] },
        { label: "백엔드 (Docker Compose)", col: [2, 3], row: [1, 3] },
      ],
      nodes: [
        { id: "app", label: "모바일 앱", sub: "VC 지갑 · 임베딩 보관", col: 0, row: 0 },
        { id: "kiosk", label: "키오스크 앱", sub: "VC 검증 · 얼굴 대조", col: 1, row: 0 },
        { id: "admin", label: "관제 웹", sub: "감사 로그 · 체인 검증", col: 3, row: 0 },
        { id: "api", label: "FastAPI", sub: "VC 발급 · 결과 기록", col: 2, row: 1 },
        { id: "pg", label: "PostgreSQL", sub: "해시 체인 감사 로그", col: 2, row: 2 },
        { id: "pub", label: "Outbox Publisher", sub: "별도 워커", col: 2, row: 3 },
        { id: "kafka", label: "Kafka", sub: "감사 이벤트", col: 3, row: 3 },
      ],
      edges: [
        { from: "kiosk", to: "app", label: "QR", offset: -9 },
        { from: "app", to: "kiosk", label: "BLE", offset: 9 },
        { from: "app", to: "api", label: "가입 · VC 발급", route: "vh" },
        { from: "kiosk", to: "api", label: "결과만 기록", offset: -10 },
        { from: "admin", to: "api", label: "로그 조회" },
        { from: "api", to: "pg" },
        { from: "pg", to: "pub", label: "outbox" },
        { from: "pub", to: "kafka" },
      ],
      steps: [
        "앱에서 SMS로 가입하고 신분증과 얼굴을 대조해, **얼굴 임베딩은 폰에만** 암호화해 보관합니다.",
        "백엔드는 성인 인증 결과로 **W3C VC를 발급**하고, 신분증 · 얼굴 원본과 임베딩은 받지 않습니다.",
        "키오스크가 QR로 챌린지를 보여 주면 폰이 BLE로 VP를 보내고, 키오스크는 **서버 호출 없이** VC를 검증하고 현장 얼굴을 대조합니다.",
        "판정 결과만 백엔드에 기록되고, 각 이벤트는 **해시 체인 감사 로그**와 outbox에 함께 저장돼 Kafka로 발행됩니다.",
      ],
    },
    shots: [
      { src: "/images/projects/agetrust/audit-logs.webp", caption: "관제 웹 감사 로그: 성공 · 실패 이벤트 조회 (화면은 팀원 작업, 감사 로그 API는 내 작업)" },
      { src: "/images/projects/agetrust/log-detail.webp", caption: "로그 상세: 이전 해시와 이벤트 해시로 이어진 체인 정보" },
      { src: "/images/projects/agetrust/signup.webp", caption: "휴대전화 SMS 인증으로 가입", phone: true },
      { src: "/images/projects/agetrust/id-card.webp", caption: "신분증 촬영", phone: true },
      { src: "/images/projects/agetrust/face.webp", caption: "신분증과 대조할 얼굴 촬영", phone: true },
      { src: "/images/projects/agetrust/credential.webp", caption: "인증 후 앱에 보관된 성인 인증서", phone: true },
    ],
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
    details: [
      {
        title: "내 역할(책임)",
        items: [
          "기획, DB 설계, 프론트엔드, Vercel 배포와 운영까지 **혼자 맡은 개인 서비스**",
          "**Supabase CLI 마이그레이션**으로 스키마와 RLS 정책 변경 이력 관리",
          "dev 작업 · main 배포의 2브랜치 전략과 GitHub 룰셋으로 두 브랜치의 삭제 · 강제 푸시 차단",
          "운영 배포마다 버전을 올리는 규칙으로 CHANGELOG와 GitHub Releases 기록",
        ],
      },
      {
        title: "위험 대처",
        items: [
          "대부분 테이블이 누구에게나 열려 있던 문제를 찾아 **서로 파트너인 두 사람만 읽는 RLS**로 전면 재작성",
          "사용자가 바꿀 수 있는 값 대신 서로를 파트너로 지정한 관계로 커플을 판정해 위장 연결 차단",
          "RLS 적용 전 **트랜잭션 + ROLLBACK**으로 역할별 조회 결과를 검증하고 실제 데이터는 그대로 유지",
          "카카오 REST 키와 VAPID 비밀 키는 **서버 Route Handler 뒤에서만** 사용",
        ],
      },
      {
        title: "구조 · 동작 방식",
        items: [
          "브라우저가 Supabase(Auth · PostgreSQL · Storage)에 직접 접근하고 **RLS가 커플 단위로 행을 거르는** 구조",
          "경로 데이터는 서버 메모리 1시간 캐시, localStorage, 일정 데이터 저장의 **3단 캐싱**으로 재호출 최소화",
          "사진은 업로드 전 브라우저에서 **300KB · 1200px 이하로 압축**",
          "서비스 워커가 백그라운드 푸시를 받고, 만료된 구독은 발송 중 자동 삭제",
        ],
      },
      {
        title: "트러블슈팅 · 배운 점",
        items: [
          "홈 화면 앱이 백그라운드에서 돌아와도 새 기록이 안 보이던 문제를 **화면 복귀 시 재조회**로 해결",
          "상대가 만든 코스 저장이 RLS 수정 정책에 막히던 문제를 읽기와 같은 기준으로 정책을 넓혀 해결",
          "경유지 순서를 바꾸는 동안 중간 순서마다 경로 API를 부르던 호출을 **2초 대기 후 조회**로 제거",
        ],
      },
    ],
    diagram: {
      groups: [
        { label: "사용자 기기", col: [0, 0], row: [1, 2] },
        { label: "Supabase", col: [1, 1], row: [0, 1] },
        { label: "Vercel", col: [1, 1], row: [2, 2] },
        { label: "외부 서비스", col: [1, 2], row: [3, 3] },
        { label: "카카오 API", col: [2, 2], row: [0, 2] },
      ],
      nodes: [
        { id: "pwa", label: "홈 화면 PWA", sub: "Next.js 16 · React 19", col: 0, row: 1 },
        { id: "sw", label: "Service Worker", sub: "푸시 수신 · 알림", col: 0, row: 2 },
        { id: "auth", label: "Supabase Auth", sub: "카카오 OAuth", col: 1, row: 0 },
        { id: "db", label: "PostgreSQL · Storage", sub: "RLS로 커플만 접근", col: 1, row: 1 },
        { id: "rh", label: "Route Handlers", sub: "경로 · 푸시 프록시", col: 1, row: 2 },
        { id: "push", label: "브라우저 푸시 서비스", sub: "Web Push", col: 1, row: 3 },
        { id: "map", label: "Kakao Maps SDK", sub: "지도 · 핀 표시", col: 2, row: 0 },
        { id: "route", label: "카카오 경로 API", sub: "대중교통 · 도보 · 자동차", col: 2, row: 2 },
      ],
      edges: [
        { from: "pwa", to: "auth", offset: -10, bend: -24 },
        { from: "pwa", to: "db", label: "기록" },
        { from: "pwa", to: "rh", offset: 10, bend: -24 },
        { from: "pwa", to: "map", route: "over" },
        { from: "rh", to: "route", label: "1시간 캐시" },
        { from: "rh", to: "db", label: "구독 조회" },
        { from: "rh", to: "push", label: "VAPID 서명" },
        { from: "push", to: "sw" },
        { from: "sw", to: "pwa", label: "알림 클릭" },
      ],
      steps: [
        "홈 화면에 설치한 PWA에서 **카카오 계정으로 Supabase Auth**에 로그인합니다.",
        "핀 · 코스 기록은 브라우저가 Supabase에 직접 읽고 쓰며, **RLS가 서로 파트너로 연결된 두 사람의 행만** 돌려줍니다.",
        "경로 조회 · 푸시 발송처럼 비밀 키가 필요한 호출은 **Vercel Route Handler**가 대신 하고, 경로 응답은 캐시해 다시 부르지 않습니다.",
        "푸시는 VAPID로 서명해 브라우저 푸시 서비스로 보내고, 앱이 닫혀 있어도 **서비스 워커**가 받아 알림을 띄웁니다.",
      ],
    },
    shots: [
      { src: "/images/projects/our-date-map/login.webp", caption: "첫 화면: 카카오 로그인", phone: true },
      { src: "/images/projects/our-date-map/push.webp", caption: "추억 핀 지도와 상대에게 알림 보내기", phone: true },
      { src: "/images/projects/our-date-map/spot.webp", caption: "핀 상세: 사진 · 이야기 · 작성자", phone: true },
      { src: "/images/projects/our-date-map/memories.webp", caption: "추억 모아보기와 연 · 월 필터", phone: true },
      { src: "/images/projects/our-date-map/plans.webp", caption: "데이트 일정 목록", phone: true },
    ],
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
    details: [
      {
        title: "내 역할(책임)",
        items: [
          "3인 팀의 **백엔드** 담당으로 프론트 · AI · 기기 사이의 **API 계약 설계**",
          "FastAPI REST API와 JWT 인증 · 인가, 사용자 · 카메라 · 이벤트 등 DB 스키마 설계",
          "SRS 미디어 서버로 RTMP 수신과 WebRTC 변환, **MQTT 도어락 원격 제어** 구현",
          "Docker Compose 한 파일로 API · 미디어 서버 · AI 분석기 · MQTT 브로커 · DB **일괄 기동** 구성",
        ],
      },
      {
        title: "위험 대처",
        items: [
          "로그아웃한 토큰은 Redis 폐기 목록으로 막고, 로그인 실패는 **IP당 10회 · 계정당 5회(5분)**로 제한",
          "소유자 · 권한 부여자 · 관리자 **3단계 인가**, 카메라가 연결되지 않은 상태면 도어락 제어 요청을 거부(503)",
          "미디어 서버 콜백은 사설 IP에서 온 요청만 받고, **등록되지 않은 스트림 키는 송출 거부**",
          "MQTT 계정 인증과 기기별 **토픽 ACL**, 도어락 명령은 QoS 1과 요청 ID로 처리 결과 기록",
        ],
      },
      {
        title: "구조 · 동작 방식",
        items: [
          "Raspberry Pi가 RTMP로 송출하면 SRS가 **WebRTC로 앱에 전달**하고 같은 스트림을 AI 분석기로 포워딩",
          "AI 분석기가 16프레임 단위로 X3D-M 추론 후 임계값 0.7을 넘으면 이벤트 등록과 영상 클립 저장",
          "백엔드가 탐지 결과를 **WebSocket과 FCM 푸시**로 앱에 통지",
          "백엔드가 MQTT로 명령을 발행하면 Pi 브릿지가 시리얼로 Arduino 도어락 제어",
        ],
      },
      {
        title: "트러블슈팅 · 배운 점",
        items: [
          "미디어 서버의 실제 송출 목록과 DB의 카메라 상태가 어긋나지 않게 **30초마다 상태 동기화**",
          "MQTT 평문 포트가 외부에 열린 한계를 문서로 남기고 TLS · 포트 비공개 · VPN 해소 방안 정리",
          "ARM64용 PyTorch에서 3D 합성곱 모델이 비정상 종료되는 문제를 확인하고 **x86_64 서버 배포**를 요건으로 명시",
        ],
      },
    ],
    diagram: {
      groups: [
        { label: "현관 기기", col: [0, 0], row: [0, 2] },
        { label: "서버 (Docker Compose)", col: [1, 2], row: [0, 2] },
        { label: "사용자 앱", col: [3, 3], row: [1, 1] },
      ],
      nodes: [
        { id: "cam", label: "Pi 카메라", sub: "RTMP 송출 · PIR", col: 0, row: 0 },
        { id: "bridge", label: "Pi 도어락 브릿지", sub: "MQTT ↔ 시리얼", col: 0, row: 1 },
        { id: "lock", label: "Arduino 도어락", sub: "NFC · 지문", col: 0, row: 2 },
        { id: "srs", label: "SRS", sub: "RTMP → WebRTC", col: 1, row: 0 },
        { id: "mqtt", label: "Mosquitto", sub: "MQTT · 토픽 ACL", col: 1, row: 1 },
        { id: "ai", label: "AI 분석기", sub: "X3D-M 이상행동", col: 2, row: 0 },
        { id: "api", label: "FastAPI 백엔드", sub: "REST · WebSocket · JWT", col: 2, row: 1 },
        { id: "db", label: "PostgreSQL · Redis", sub: "기록 · 토큰 폐기", col: 2, row: 2 },
        { id: "app", label: "Flutter 앱", sub: "영상 · 제어 · 알림", col: 3, row: 1 },
      ],
      edges: [
        { from: "cam", to: "srs", label: "RTMP" },
        { from: "srs", to: "ai", label: "포워딩" },
        { from: "srs", to: "app", label: "WebRTC 영상", route: "over" },
        { from: "ai", to: "api", label: "탐지 이벤트" },
        { from: "app", to: "api", label: "REST", offset: -9 },
        { from: "api", to: "app", label: "알림", offset: 9 },
        { from: "api", to: "mqtt", label: "문 열기" },
        { from: "mqtt", to: "bridge", label: "MQTT" },
        { from: "bridge", to: "lock", label: "시리얼" },
        { from: "api", to: "db" },
      ],
      steps: [
        "현관의 **Pi 카메라**가 영상을 RTMP로 SRS에 보내고, SRS는 등록된 스트림 키인지 백엔드에 확인합니다.",
        "SRS가 영상을 **WebRTC로 바꿔 앱에 전달**하고, 같은 스트림을 AI 분석기로 넘깁니다.",
        "**AI 분석기**가 폭행 · 납치 같은 이상행동을 판정해 이벤트로 등록하면, 백엔드가 WebSocket과 FCM으로 앱에 알립니다.",
        "앱에서 문 열기를 누르면 백엔드가 권한을 확인하고 **MQTT 명령**을 보내, Pi 브릿지가 시리얼로 도어락을 엽니다.",
      ],
    },
    shots: [
      { src: "/images/projects/smart-doorlock/home.webp", caption: "홈: 오늘의 이벤트와 카메라 상태", phone: true },
      { src: "/images/projects/smart-doorlock/doorlock.webp", caption: "카메라별 도어락 원격 열기 · 잠그기", phone: true },
      { src: "/images/projects/smart-doorlock/alerts.webp", caption: "AI 탐지 알림과 영상 재생", phone: true },
      { src: "/images/projects/smart-doorlock/cctv.webp", caption: "카메라를 골라 실시간 영상 보기", phone: true },
      { src: "/images/projects/smart-doorlock/login.webp", caption: "관리자가 발급한 계정으로만 로그인", phone: true },
    ],
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
  { title: "AICE Basic", issuer: "KT · 한국경제신문", date: "2026.10", note: "AI 활용 능력" },
  { title: "AWS Certified AI Practitioner", issuer: "AWS", date: "2026.09", note: "AIF-C01" },
  { title: "TOEIC 655", issuer: "", date: "2026.03" },
  { title: "TRIZ 1수준", issuer: "한국트리즈협회", date: "2024.10", note: "창의적 문제해결" },
];

export const site = {
  url: "https://sehyeokkim.com", // 대표 주소 (cloudfront.net 주소로도 열리지만 검색 · 공유는 이 주소로 통일)
  repository: "https://github.com/SehyeokKim/sehyeokkim.com",
};
