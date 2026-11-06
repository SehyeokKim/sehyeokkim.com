// 프로젝트 상세 창의 구성도. resume.ts의 격자 좌표(열 · 행)만 받아 위치와 선을 계산해 그린다.
// 선은 모두 직각이고, 사람 승인 단계는 사이트 공통 규칙대로 --signal 색으로 구분한다.
import type { Diagram, DiagramEdge, DiagramNode } from "@/content/resume";

const CW = 236; // 열 너비 (상자 사이 가로 틈에 선 이름이 들어갈 만큼)
const CH = 116; // 행 높이
const NW = 156; // 상자 너비
const NH = 54; // 상자 높이
const PAD = 12;
const TOP = 40; // 상자의 칸 안 세로 위치 (위쪽에 묶음 이름 · 위로 돌아가는 선 자리)

const nx = (n: DiagramNode) => PAD + n.col * CW + (CW - NW) / 2;
const ny = (n: DiagramNode) => PAD + n.row * CH + TOP;

type Pt = [number, number];

// 시작 · 끝 상자와 경로 방식으로 꺾이는 점들을 만든다
function route(a: DiagramNode, b: DiagramNode, e: DiagramEdge): Pt[] {
  const off = e.offset ?? 0;
  const ax = nx(a);
  const ay = ny(a);
  const bx = nx(b);
  const by = ny(b);
  if (a.col === b.col) {
    // 같은 열: 위아래로 곧게
    const x = ax + NW / 2 + off;
    return a.row < b.row ? [[x, ay + NH], [x, by]] : [[x, ay], [x, by + NH]];
  }
  if (e.route === "over") {
    // 사이 상자를 피해 위쪽 빈 줄로 돌아가 대상 상자 위로 들어간다
    const x1 = ax + NW / 2 + off;
    const x2 = bx + NW / 2 + off;
    const y = Math.min(ay, by) - 12;
    return [[x1, ay], [x1, y], [x2, y], [x2, by]];
  }
  const right = b.col > a.col;
  const sx = right ? ax + NW : ax;
  const tx = right ? bx : bx + NW;
  if (e.route === "vh") {
    // 세로로 먼저 내려(올라)간 뒤 가로로 들어간다
    const x = ax + NW / 2 + off;
    const y = by + NH / 2;
    return [[x, a.row < b.row ? ay + NH : ay], [x, y], [tx, y]];
  }
  const sy = ay + NH / 2 + off;
  const ty = by + NH / 2 + off;
  if (a.row === b.row) return [[sx, sy], [tx, ty]];
  // 가로 → 열 사이 빈칸에서 세로 → 가로
  const mx = PAD + (right ? a.col + 1 : a.col) * CW + (e.bend ?? 0);
  return [[sx, sy], [mx, sy], [mx, ty], [tx, ty]];
}

// 이름표는 가장 긴 구간의 가운데에 둔다
function labelAt(pts: Pt[]): { x: number; y: number; vertical: boolean } {
  let best = 0;
  let len = -1;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.abs(pts[i + 1][0] - pts[i][0]) + Math.abs(pts[i + 1][1] - pts[i][1]);
    if (l > len) {
      len = l;
      best = i;
    }
  }
  const [p, q] = [pts[best], pts[best + 1]];
  return { x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, vertical: p[0] === q[0] };
}

export default function ProjectDiagram({ id, title, diagram: d }: { id: string; title: string; diagram: Diagram }) {
  const cols = Math.max(...d.nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...d.nodes.map((n) => n.row)) + 1;
  const W = PAD * 2 + cols * CW;
  const H = PAD * 2 + rows * CH;
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  const kinds = new Set(d.edges.map((e) => e.kind ?? "data"));

  return (
    <figure className="arch project-arch">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={`${id}-t ${id}-d`} style={{ minWidth: Math.min(W, 720), maxWidth: W }}>
        <title id={`${id}-t`}>{title}</title>
        <desc id={`${id}-d`}>{d.steps.join(" ")}</desc>
        <defs>
          <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,0 L10,5 L0,10 z" className="arch-arrow" />
          </marker>
        </defs>

        {d.groups.map((g) => {
          const x = PAD + g.col[0] * CW + 6;
          const y = PAD + g.row[0] * CH + 4;
          return (
            <g key={g.label} className="arch-group">
              <rect x={x} y={y} width={(g.col[1] - g.col[0] + 1) * CW - 12} height={(g.row[1] - g.row[0] + 1) * CH - 8} rx={12} />
              <text x={x + 12} y={y + 17} className="arch-group-label">
                {g.label}
              </text>
            </g>
          );
        })}

        {d.edges.map((e) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const pts = route(a, b, e);
          const l = e.label ? labelAt(pts) : null;
          return (
            <g key={`${e.from}-${e.to}`}>
              <path
                d={pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ")}
                className={`arch-edge ${e.kind ?? ""}`}
                markerEnd={`url(#${id}-arrow)`}
              />
              {l && (
                <text
                  x={l.vertical ? l.x + 6 : l.x}
                  y={l.vertical ? l.y + 4 : l.y - 6}
                  className={`arch-edge-label halo${l.vertical ? "" : " center"}`}
                >
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {d.nodes.map((n) => (
          <g key={n.id} className="arch-node">
            <rect x={nx(n)} y={ny(n)} width={NW} height={NH} rx={10} />
            <text x={nx(n) + NW / 2} y={ny(n) + (n.sub ? 23 : 32)} className="arch-label">
              {n.label}
            </text>
            {n.sub && (
              <text x={nx(n) + NW / 2} y={ny(n) + 41} className="arch-sub">
                {n.sub}
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption>
        <span className="legend-item">
          <span className="legend solid" /> 데이터 · 요청
        </span>
        {kinds.has("approval") && (
          <span className="legend-item">
            <span className="legend approval" /> 사람 승인
          </span>
        )}
        {kinds.has("deploy") && (
          <span className="legend-item">
            <span className="legend deploy" /> 배포
          </span>
        )}
        <span className="legend-item">
          <span className="legend group" /> 실행 위치
        </span>
      </figcaption>
    </figure>
  );
}
