// 비공개 대시보드의 공고 파이프라인: 자동 수집 · 직접 추가 → DynamoDB → 본인 승인, 그리고 로그인한 조회 경로.
// ArchitectureDiagram과 같은 클래스(arch-*)를 써서 색 · 선 모양 · 범례를 맞춘다. planned는 점선(구현 예정).

type Node = { x: number; y: number; w: number; label: string; sub: string; planned?: boolean };

const H = 52;
const mid = (y: number) => y + H / 2;

const RA = 50;
const RB = 150;
const RD = 120;
const RC = 260;

const nodes: Node[] = [
  { x: 10, y: RA, w: 150, label: "EventBridge", sub: "매일 1회 실행", planned: true },
  { x: 190, y: RA, w: 170, label: "수집 Lambda", sub: "robots 확인 · 허용 소스만", planned: true },
  { x: 10, y: RB, w: 150, label: "공고 목록 파일", sub: "직접 정리 · AI 도구", planned: true },
  { x: 190, y: RB, w: 170, label: "적재 스크립트", sub: "형식 검사 · 미리보기", planned: true },
  { x: 400, y: RD, w: 170, label: "DynamoDB", sub: "최소 항목 · 마감 후 삭제", planned: true },
  { x: 620, y: RD, w: 170, label: "본인 검토", sub: "지원 후보로 승인 · 제외", planned: true },
  { x: 10, y: RC, w: 150, label: "나", sub: "Google 로그인 · 본인만", planned: true },
  { x: 190, y: RC, w: 170, label: "CloudFront", sub: "/api/* · 캐시 없음", planned: true },
  { x: 400, y: RC, w: 170, label: "API Gateway · Lambda", sub: "세션 확인 · 목록 조회", planned: true },
];

const edges = [
  `M160,${mid(RA)} H190`, // EventBridge → 수집 Lambda
  `M360,${mid(RA)} H485 V${RD}`, // 수집 Lambda → DynamoDB
  `M160,${mid(RB)} H190`, // 공고 목록 파일 → 적재 스크립트
  `M360,${mid(RB)} H380 V${mid(RD)} H400`, // 적재 스크립트 → DynamoDB
  `M570,${RD + 18} H620`, // DynamoDB → 본인 검토 (새 공고)
  `M620,${RD + 36} H570`, // 본인 검토 → DynamoDB (승인 결과)
  `M160,${mid(RC)} H190`, // 나 → CloudFront
  `M360,${mid(RC)} H400`, // CloudFront → API Gateway · Lambda
  `M485,${RC} V${RD + H}`, // API Gateway · Lambda → DynamoDB (조회)
];

const lanes = [
  { y: RA - 10, label: "자동 수집" },
  { y: RB - 10, label: "직접 추가 (승인 후 적재)" },
  { y: RC - 10, label: "조회" },
];

export default function PipelineDiagram() {
  return (
    <figure className="arch">
      <svg viewBox="0 0 800 330" role="img" aria-labelledby="pipeline-title pipeline-desc">
        <title id="pipeline-title">비공개 대시보드 공고 파이프라인</title>
        <desc id="pipeline-desc">
          EventBridge가 매일 한 번 수집 Lambda를 실행하고, 수집 Lambda는 robots.txt와 약관이 허용한 소스만 조회해 최소
          항목을 DynamoDB에 새 공고로 저장한다. 직접 정리한 공고 목록은 적재 스크립트가 형식을 검사하고 바뀌는 내용을
          보여 준 뒤 승인하면 저장한다. 새 공고는 본인이 검토해 지원 후보로 승인하거나 제외한다. 조회는 Google로 로그인한
          본인만 CloudFront의 /api 경로를 거쳐 API Gateway와 Lambda로 목록을 받는다. 모두 구현 예정이다.
        </desc>
        <defs>
          <marker id="pipeline-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="arch-arrow" />
          </marker>
        </defs>

        {lanes.map((l) => (
          <text key={l.label} x={10} y={l.y} className="arch-group-label">
            {l.label}
          </text>
        ))}

        {edges.map((d) => (
          <path key={d} d={d} className="arch-edge planned" markerEnd="url(#pipeline-arrow)" />
        ))}

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
      <figcaption>
        <span className="legend-item">
          <span className="legend solid" /> 운영 중
        </span>
        <span className="legend-item">
          <span className="legend dashed" /> 구현 예정
        </span>
      </figcaption>
    </figure>
  );
}
