// 이 사이트의 AWS 구성도. 색은 CSS 변수를 따라 라이트 · 다크 테마에 맞춰진다.
// planned 노드는 아직 배포 전인 구성 요소로, 점선으로 표시한다.

type Node = {
  x: number;
  y: number;
  w: number;
  label: string;
  sub: string;
  planned?: boolean;
};

const H = 52;

const nodes: Record<string, Node> = {
  user: { x: 10, y: 110, w: 112, label: "브라우저", sub: "HTTPS" },
  cf: { x: 172, y: 110, w: 132, label: "CloudFront", sub: "CDN · 단일 출처" },
  s3: { x: 356, y: 20, w: 132, label: "S3", sub: "정적 사이트 · OAC" },
  api: { x: 356, y: 200, w: 132, label: "API Gateway", sub: "/api/*", planned: true },
  lambda: { x: 540, y: 200, w: 112, label: "Lambda", sub: "FastAPI", planned: true },
  ddb: { x: 540, y: 20, w: 112, label: "DynamoDB", sub: "온디맨드", planned: true },
  gh: { x: 172, y: 20, w: 132, label: "GitHub Actions", sub: "OIDC · 키 없음" },
};

const edges: { from: string; to: string; planned?: boolean }[] = [
  { from: "user", to: "cf" },
  { from: "cf", to: "s3" },
  { from: "cf", to: "api", planned: true },
  { from: "api", to: "lambda", planned: true },
  { from: "lambda", to: "ddb", planned: true },
];

function anchor(n: Node, side: "l" | "r" | "t" | "b") {
  if (side === "l") return { x: n.x, y: n.y + H / 2 };
  if (side === "r") return { x: n.x + n.w, y: n.y + H / 2 };
  if (side === "t") return { x: n.x + n.w / 2, y: n.y };
  return { x: n.x + n.w / 2, y: n.y + H };
}

function edgePath(a: Node, b: Node) {
  const overlapX = a.x < b.x + b.w && b.x < a.x + a.w;
  const above = b.y + H <= a.y;
  const below = a.y + H <= b.y;

  // 같은 열: 수직 직선
  if (overlapX && (above || below)) {
    const p = anchor(a, above ? "t" : "b");
    const q = anchor(b, above ? "b" : "t");
    return `M${p.x},${p.y} L${q.x},${q.y}`;
  }
  // 오른쪽 위: 오른쪽으로 나와 꺾어서 위로
  if (above) {
    const p = anchor(a, "r");
    const q = anchor(b, "b");
    return `M${p.x},${p.y} Q${q.x},${p.y} ${q.x},${q.y}`;
  }
  const p = anchor(a, "r");
  const q = anchor(b, "l");
  const mx = (p.x + q.x) / 2;
  return `M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`;
}

export default function ArchitectureDiagram() {
  const deployTargets = [nodes.s3, nodes.cf];

  return (
    <figure className="arch">
      <svg viewBox="0 0 662 262" role="img" aria-labelledby="arch-title arch-desc">
        <title id="arch-title">sehyeokkim.com AWS 구성도</title>
        <desc id="arch-desc">
          브라우저가 CloudFront로 접속하면 기본 경로는 S3 정적 사이트로, /api 경로는 API Gateway와 Lambda를 거쳐
          DynamoDB로 연결된다. GitHub Actions는 OIDC 임시 자격 증명으로 배포한다.
        </desc>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="arch-arrow" />
          </marker>
        </defs>

        {edges.map((e) => (
          <path
            key={`${e.from}-${e.to}`}
            d={edgePath(nodes[e.from], nodes[e.to])}
            className={e.planned ? "arch-edge planned" : "arch-edge"}
            markerEnd="url(#arrow)"
          />
        ))}

        {deployTargets.map((t) => (
          <path
            key={`deploy-${t.label}`}
            d={edgePath(nodes.gh, t)}
            className="arch-edge deploy"
            markerEnd="url(#arrow)"
          />
        ))}

        {Object.entries(nodes).map(([key, n]) => (
          <g key={key} className={n.planned ? "arch-node planned" : "arch-node"}>
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
        <span className="legend solid" /> 운영 중 <span className="legend dashed" /> 구축 예정
        <span className="legend deploy" /> 자동 배포
      </figcaption>
    </figure>
  );
}
