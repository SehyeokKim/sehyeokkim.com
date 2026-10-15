import ArchitectureDiagram from "@/app/components/ArchitectureDiagram";
import { certifications, education, profile, projects, site, skills } from "@/content/resume";

const nav = [
  { id: "about", label: "소개" },
  { id: "skills", label: "기술" },
  { id: "projects", label: "프로젝트" },
  { id: "education", label: "교육 · 자격" },
  { id: "this-site", label: "이 사이트" },
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <a href="#top" className="brand">
            {profile.name}
          </a>
          <nav aria-label="섹션">
            {nav.map((n) => (
              <a key={n.id} href={`#${n.id}`}>
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main id="top" className="container">
        <section id="about" className="hero">
          <p className="eyebrow">Cloud · Infrastructure</p>
          <h1>{profile.name}</h1>
          <p className="headline">{profile.headline}</p>
          {profile.intro.map((p) => (
            <p key={p} className="intro">
              {p}
            </p>
          ))}
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
        </section>

        <section id="skills">
          <h2>기술 스택</h2>
          <div className="skill-grid">
            {skills.map((s) => (
              <div key={s.category} className="card">
                <h3>{s.category}</h3>
                <ul className="tags">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="projects">
          <h2>프로젝트</h2>
          <div className="project-list">
            {projects.map((p) => (
              <article key={p.title} className="card project">
                <header>
                  <h3>{p.title}</h3>
                  <span className="muted">{p.period}</span>
                </header>
                <p>{p.summary}</p>
                <p className="muted">역할: {p.role}</p>
                <ul>
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

        <section id="education">
          <h2>교육 · 자격</h2>
          <div className="two-col">
            <div>
              <h3>교육</h3>
              <ul className="timeline">
                {education.map((e) => (
                  <li key={e.title}>
                    <strong>{e.title}</strong>
                    {e.issuer && <span className="muted"> · {e.issuer}</span>}
                    <span className="muted date">{e.date}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>자격</h3>
              <ul className="timeline">
                {certifications.map((c) => (
                  <li key={c.title}>
                    <strong>{c.title}</strong>
                    {c.issuer && <span className="muted"> · {c.issuer}</span>}
                    <span className="muted date">{c.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="this-site">
          <h2>이 사이트는 이렇게 만들어졌습니다</h2>
          <div className="card site-card">
            <p>
              이 이력서 사이트는 AWS 위에 직접 설계 · 배포 · 운영하고 있습니다. 인프라는 Terraform 코드로 관리하고,
              GitHub에 병합하면 장기 액세스 키 없이 자동으로 배포됩니다.
            </p>
            <ArchitectureDiagram />
            <ul className="site-points">
              <li>
                <strong>서버리스</strong> 상시 실행 서버 없이 S3 · CloudFront로 서빙
              </li>
              <li>
                <strong>코드로 관리</strong> 모든 AWS 리소스를 Terraform으로 생성 · 변경
              </li>
              <li>
                <strong>안전한 배포</strong> GitHub Actions OIDC, 최소 권한 배포 역할
              </li>
              <li>
                <strong>비용 관리</strong> 무료 한도 안의 서비스만 사용, 예산 알림
              </li>
            </ul>
            <a className="button" href={site.repository} target="_blank" rel="noopener noreferrer">
              GitHub 저장소 보기
            </a>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <span>© {new Date().getFullYear()} {profile.name}</span>
          <a href={site.repository} target="_blank" rel="noopener noreferrer">
            Source
          </a>
        </div>
      </footer>
    </>
  );
}
