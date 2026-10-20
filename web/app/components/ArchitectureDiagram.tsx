// 이 사이트의 AWS 구성도: 계정 구조(Organizations) → 워크로드 계정 안의 리소스 → 배포 · 접근 경로.
// 색은 CSS 변수를 따라 라이트 · 다크 테마에 맞춰진다. 구조만 그리고 계정 ID · 비밀값은 넣지 않는다.
// planned는 아직 배포 전인 구성 요소(비공개 영역 백엔드 등)로, 점선으로 표시한다.

type Node = {
  x: number;
  y: number;
  w: number;
  label: string;
  sub: string;
  planned?: boolean;
};

type Edge = { d: string; kind?: "planned" | "deploy" };

const H = 52;

// 열: 바깥(사람 · 외부) / 워크로드 계정 1–3열
const X0 = 10;
const C1 = 195;
const C2 = 395;
const C3 = 595;
// 행
const R1 = 60;
const R2 = 160;
const R3 = 255;
const R4 = 372;

const nodes: Node[] = [
  // 계정 바깥
  { x: X0, y: R2, w: 130, label: "브라우저", sub: "방문자 · 운영자" },
  { x: X0, y: R3, w: 130, label: "GitHub Actions", sub: "main 병합 시 배포" },
  { x: X0, y: R4, w: 130, label: "운영자", sub: "Terraform 적용" },
  // 워크로드 계정
  { x: C1, y: R1, w: 110, label: "Route 53", sub: "sehyeokkim.com" },
  { x: C2, y: R1, w: 140, label: "S3", sub: "정적 사이트 · OAC" },
  { x: C3, y: R1, w: 160, label: "SSM Parameter Store", sub: "OAuth 키 · JWT 키" },
  { x: C1, y: R2, w: 140, label: "CloudFront", sub: "CDN · HTTPS(ACM)" },
  { x: C2, y: R2, w: 140, label: "API Gateway", sub: "/api/* · 비공개 영역" },
  { x: C3, y: R2, w: 160, label: "Lambda", sub: "FastAPI · Google 로그인" },
  { x: C1, y: R3, w: 140, label: "배포 역할", sub: "OIDC · 최소 권한" },
  { x: C2, y: R3, w: 140, label: "AWS Budgets", sub: "월 예산 알림" },
  { x: C3, y: R3, w: 160, label: "DynamoDB", sub: "지원 후보 공고" },
  // 관리 계정
  { x: C1, y: R4, w: 160, label: "IAM Identity Center", sub: "SSO · MFA" },
  { x: C1 + 200, y: R4, w: 150, label: "Route 53 Domains", sub: "도메인 등록 · NS 위임" },
];

// 선은 모두 직각. 좌표는 위 노드 배치 기준
const mid = (y: number) => y + H / 2;
const edges: Edge[] = [
  { d: `M${X0 + 65},${R2} V${mid(R1)} H${C1}` }, // 브라우저 → Route 53 (주소 조회)
  { d: `M${X0 + 130},${mid(R2)} H${C1}` }, // 브라우저 → CloudFront
  { d: `M${C1 + 125},${R2} V${mid(R1)} H${C2}` }, // CloudFront → S3 (Route 53 오른쪽으로 비켜 올라간다)
  { d: `M${C1 + 140},${mid(R2)} H${C2}` }, // CloudFront → API Gateway
  { d: `M${C2 + 140},${mid(R2)} H${C3}` }, // API Gateway → Lambda
  { d: `M${C3 + 80},${R2} V${R1 + H}` }, // Lambda → SSM
  { d: `M${C3 + 80},${R2 + H} V${R3}` }, // Lambda → DynamoDB
  { d: `M${X0 + 130},${mid(R3)} H${C1}`, kind: "deploy" }, // GitHub Actions → 배포 역할
  { d: `M${C1 + 70},${R3} V${R2 + H}`, kind: "deploy" }, // 배포 역할 → CloudFront (캐시 무효화)
  { d: `M${C1 + 140},${R3 + 20} H${C1 + 170} V${R1 + 40} H${C2}`, kind: "deploy" }, // 배포 역할 → S3 (파일 동기화)
  { d: `M${X0 + 130},${mid(R4)} H${C1}` }, // 운영자 → Identity Center
  // Identity Center → 워크로드 계정 (권한 세트). 관리 계정 라벨을 피해 오른쪽으로 나와, 리소스가 없는 빈 칸으로 계정 경계를 가리킨다
  { d: `M${C1 + 160},${mid(R4)} H${C1 + 180} V325` },
];

// 계정 경계
const groups = [
  { x: 160, y: 10, w: 630, h: 450, label: "AWS Organizations", outer: true },
  { x: 175, y: 32, w: 600, h: 293, label: "워크로드 계정: 사이트 리소스 · 계정 전체 S3 퍼블릭 차단" },
  { x: 175, y: 345, w: 395, h: 100, label: "관리 계정: 사용자 · 결제 · 도메인 관리" },
];

// 점선 범례는 구축 예정인 요소가 있을 때만 보인다
const hasPlanned = nodes.some((n) => n.planned) || edges.some((e) => e.kind === "planned");

export default function ArchitectureDiagram() {
  return (
    <figure className="arch">
      <svg viewBox="0 0 800 470" role="img" aria-labelledby="arch-title arch-desc">
        <title id="arch-title">sehyeokkim.com AWS 구성도</title>
        <desc id="arch-desc">
          AWS Organizations 아래 관리 계정과 워크로드 계정이 분리되어 있다. 운영자는 관리 계정의 IAM Identity Center(SSO,
          MFA)로 권한 세트를 받아 워크로드 계정에 접근한다. 도메인 sehyeokkim.com은 관리 계정의 Route 53 Domains에
          등록하고, 네임서버는 워크로드 계정의 Route 53 호스팅 영역으로 위임했다. 브라우저는 Route 53에서 주소를 찾아
          CloudFront에 HTTPS(ACM 인증서)로 접속하고, 기본 경로는 S3 정적 사이트로, /api 경로는 API Gateway와 Lambda를
          거쳐 DynamoDB와 SSM Parameter Store로 연결된다.
          GitHub Actions는 OIDC로 최소 권한 배포 역할을 맡아 S3에 파일을 올리고 CloudFront 캐시를 무효화한다.
        </desc>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="arch-arrow" />
          </marker>
        </defs>

        {groups.map((g) => (
          <g key={g.label} className={g.outer ? "arch-group outer" : "arch-group"}>
            <rect x={g.x} y={g.y} width={g.w} height={g.h} rx={12} />
            <text x={g.x + 12} y={g.y + 16} className="arch-group-label">
              {g.label}
            </text>
          </g>
        ))}

        {edges.map((e) => (
          <path
            key={e.d}
            d={e.d}
            className={e.kind ? `arch-edge ${e.kind}` : "arch-edge"}
            markerEnd="url(#arrow)"
          />
        ))}

        <text x={C1 + 188} y={340} className="arch-edge-label">
          권한 세트로 접근
        </text>

        {nodes.map((n) => (
          <g key={n.label} className={n.planned ? "arch-node planned" : "arch-node"}>
            <rect x={n.x} y={n.y} width={n.w} height={H} rx={10} />
            <text x={n.x + n.w / 2} y={n.y + 22} className="arch-label">
              {n.label}
            </text>
            <text x={n.x + n.w / 2} y={n.y + 40} className="arch-sub">
              {n.sub}
            </text>
          </g>
        ))}
      </svg>
      {/* 표시와 글자가 다른 줄로 갈라지지 않게 항목마다 묶는다 */}
      <figcaption>
        <span className="legend-item">
          <span className="legend solid" /> 운영 중
        </span>
        {hasPlanned && (
          <span className="legend-item">
            <span className="legend dashed" /> 구축 예정
          </span>
        )}
        <span className="legend-item">
          <span className="legend deploy" /> 자동 배포
        </span>
        <span className="legend-item">
          <span className="legend group" /> 계정 경계
        </span>
      </figcaption>
    </figure>
  );
}
