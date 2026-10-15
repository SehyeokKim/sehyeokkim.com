import ArchitectureDiagram from "@/app/components/ArchitectureDiagram";
import { certifications, education, profile, projects, site, skills } from "@/content/resume";

const nav = [
  { id: "overview", label: "요약" },
  { id: "skills", label: "기술 스택" },
  { id: "projects", label: "프로젝트" },
  { id: "education", label: "교육 · 자격" },
  { id: "this-site", label: "이 사이트" },
];

// 상단 지표 카드. 비용처럼 측정이 필요한 값은 측정 전까지 "측정 중"으로 둔다
const stats = [
  { label: "프로젝트", value: String(projects.length), hint: "아래 카드" },
  { label: "자격", value: String(certifications.length), hint: "교육 · 자격" },
  { label: "배포", value: "자동", hint: "GitHub Actions" },
  { label: "월 운영비", value: "측정 중", hint: "AWS 청구서 기준" },
];

function initials(name: string) {
  return name.slice(-2);
}

export default function Home() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="profile">
          <div className="avatar" aria-hidden="true">
            {initials(profile.name)}
          </div>
          <div>
            <h1>{profile.name}</h1>
            <p className="role">Cloud · Infrastructure</p>
          </div>
        </div>
        <p className="headline">{profile.headline}</p>
        <div className="links">
          <a className="button" href={profile.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          {profile.email && (
            <a className="button secondary" href={`mailto:${profile.email}`}>
              Email
            </a>
          )}
        </div>
        <nav className="side-nav" aria-label="섹션">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`}>
              {n.label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="content">
        <section id="overview" className="stats" aria-label="요약 지표">
          {stats.map((s) => (
            <div key={s.label} className="card stat">
              <span className="stat-label">{s.label}</span>
              <strong className="stat-value">{s.value}</strong>
              <span className="stat-hint">{s.hint}</span>
            </div>
          ))}
        </section>

        <section className="card intro-card" aria-label="소개">
          <h2>소개</h2>
          {profile.intro.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        <div className="grid-2">
          <section id="skills" className="card">
            <h2>기술 스택</h2>
            <dl className="skill-list">
              {skills.map((s) => (
                <div key={s.category}>
                  <dt>{s.category}</dt>
                  <dd>
                    <ul className="tags">
                      {s.items.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="education" className="card">
            <h2>교육 · 자격</h2>
            <ul className="timeline">
              {[...education, ...certifications].map((e) => (
                <li key={e.title}>
                  <div>
                    <strong>{e.title}</strong>
                    {e.issuer && <span className="muted"> · {e.issuer}</span>}
                  </div>
                  <span className="muted date">{e.date}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section id="projects">
          <h2 className="section-title">프로젝트</h2>
          <div className="grid-2">
            {projects.map((p) => (
              <article key={p.title} className="card project">
                <header>
                  <h3>{p.title}</h3>
                  <span className="muted">{p.period}</span>
                </header>
                <p>{p.summary}</p>
                <p className="muted small">역할 · {p.role}</p>
                <ul className="highlights">
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
                <ul className="tags">
                  {p.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {p.links && (
                  <p className="project-links">
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label}
                      </a>
                    ))}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="this-site" className="card site-card">
          <h2>이 사이트는 이렇게 만들어졌습니다</h2>
          <p className="muted">
            이 이력서 사이트는 AWS 위에 직접 설계 · 배포 · 운영하고 있습니다. 인프라는 Terraform 코드로 관리하고,
            GitHub에 병합하면 장기 액세스 키 없이 자동으로 배포됩니다.
          </p>
          <ArchitectureDiagram />
          <ul className="site-points">
            <li>
              <strong>서버리스</strong>
              <span>상시 실행 서버 없이 S3 · CloudFront로 서빙</span>
            </li>
            <li>
              <strong>코드로 관리</strong>
              <span>모든 AWS 리소스를 Terraform으로 생성 · 변경</span>
            </li>
            <li>
              <strong>안전한 배포</strong>
              <span>GitHub Actions OIDC, 최소 권한 배포 역할</span>
            </li>
            <li>
              <strong>비용 관리</strong>
              <span>무료 한도 안의 서비스만 사용, 예산 알림</span>
            </li>
          </ul>
          <a className="button" href={site.repository} target="_blank" rel="noopener noreferrer">
            GitHub 저장소 보기
          </a>
        </section>

        <footer className="footer">
          <span>
            © {new Date().getFullYear()} {profile.name}
          </span>
          <a href={site.repository} target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </footer>
      </main>
    </div>
  );
}
