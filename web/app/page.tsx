import ArchitectureDiagram from "@/app/components/ArchitectureDiagram";
import { certifications, education, profile, projects, site, skills, type Skill } from "@/content/resume";

function initials(name: string) {
  return name.slice(-2);
}

// 자기 평가 1–5를 별로 표시. 값이 없으면 아무것도 그리지 않는다
function Level({ level }: { level: Skill["level"] }) {
  if (!level) return null;
  return (
    <span className="level" aria-label={`5점 중 ${level}점`}>
      {"★".repeat(level)}
      <span className="level-off">{"★".repeat(5 - level)}</span>
    </span>
  );
}

// 오른쪽 열의 한 항목: 굵은 세로 막대 + "제목 — 한글 부제" + 설명 + (선택) 큰 숫자
function Entry({
  id,
  title,
  subtitle,
  figure,
  unit,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  figure?: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="entry">
      <div className="entry-body">
        <h2>
          {title} <span className="entry-sub">— {subtitle}</span>
        </h2>
        {children}
      </div>
      {figure && (
        <p className="figure">
          {figure}
          {unit && <span className="figure-unit">{unit}</span>}
        </p>
      )}
    </section>
  );
}

// 하단 섹션 제목: 제목 + 이어지는 얇은 가로선
function RuleTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="rule-title">
      <span>{children}</span>
    </h2>
  );
}

export default function Home() {
  return (
    <main className="page">
      <header className="hero">
        <div className="avatar" aria-hidden="true">
          {initials(profile.name)}
        </div>
        <div>
          <h1>
            {profile.name}
            {profile.nameEn && <span className="name-en">{profile.nameEn}</span>}
          </h1>
          <p className="role-bar">{profile.role}</p>
          <p className="headline">{profile.headline}</p>
        </div>
      </header>

      <div className="resume">
        <aside className="side">
          <div className="side-block">
            <h2 className="label">PROFILE / CONTACT</h2>
            <ul className="side-list">
              <li>
                <a href={profile.github} target="_blank" rel="noopener noreferrer">
                  {profile.github.replace("https://", "")}
                </a>
              </li>
              {profile.email && (
                <li>
                  <a href={`mailto:${profile.email}`}>{profile.email}</a>
                </li>
              )}
            </ul>
          </div>

          <div id="skills" className="side-block">
            <h2 className="label">SKILLS</h2>
            {skills.map((s) => (
              <div key={s.category} className="skill-group">
                <h3>{s.category}</h3>
                <ul className="side-list">
                  {s.items.map((i) => (
                    <li key={i.name} className="skill">
                      <Level level={i.level} />
                      <span>{i.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="side-block">
            <h2 className="label">CERTIFICATIONS</h2>
            <ul className="side-list">
              {certifications.map((c) => (
                <li key={c.title}>
                  <strong>{c.title}</strong>
                  <span className="muted small">
                    {c.issuer}
                    {c.issuer && c.date && " · "}
                    {c.date}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="main-col">
          <Entry title="About" subtitle="소개">
            {profile.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Entry>

          <Entry title="Projects" subtitle="프로젝트" figure={String(projects.length)} unit="개">
            <p>{projects.map((p) => p.title).join(" · ")}</p>
          </Entry>

          <Entry id="education" title="Education" subtitle="교육">
            {education.map((e) => (
              <p key={e.title}>
                <strong>{e.title}</strong>
                {e.issuer && <span className="muted"> · {e.issuer}</span>}
                <span className="muted"> · {e.date}</span>
              </p>
            ))}
          </Entry>

          <Entry title="This Site" subtitle="이 사이트" figure="AWS">
            <p>
              이 이력서 사이트는 AWS 위에 직접 설계 · 배포 · 운영하고 있습니다. 인프라는 Terraform 코드로 관리하고,
              GitHub에 병합하면 장기 액세스 키 없이 자동으로 배포됩니다.
            </p>
          </Entry>
        </div>
      </div>

      <section id="projects" className="block">
        <RuleTitle>Projects</RuleTitle>
        <ol className="timeline" aria-label="프로젝트 타임라인">
          {projects.map((p) => (
            <li key={p.title}>
              <span className="dot" aria-hidden="true" />
              <span className="timeline-period">{p.period}</span>
              <span className="timeline-title">{p.title}</span>
            </li>
          ))}
        </ol>
        <div className="project-list">
          {projects.map((p) => (
            <article key={p.title} className="project">
              <header>
                <h3>{p.title}</h3>
                <span className="muted small">{p.period}</span>
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

      <section id="this-site" className="block">
        <RuleTitle>This Site</RuleTitle>
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
  );
}
