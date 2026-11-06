import ArchitectureDiagram from "@/app/components/ArchitectureDiagram";
import ProjectDiagram from "@/app/components/ProjectDiagram";
import ShotGallery from "@/app/components/ShotGallery";
import CopyEmail from "@/app/components/CopyEmail";
import { LegalLink, LegalPopover } from "@/app/components/LegalPopover";
import Motion from "@/app/components/Motion";
import { EntrySiteCard, EntryToc } from "@/app/components/PrivateEntry";
import Toc, { type TocItem } from "@/app/components/Toc";
import ThemeToggle from "@/app/components/ThemeToggle";
import { icons, type IconName } from "@/content/icons";
import { legal, projectLegal } from "@/content/legal";
import {
  certifications,
  education,
  profile,
  projects,
  site,
  skills,
  type Credential,
  type Project,
  type Skill,
} from "@/content/resume";

const toc: TocItem[] = [
  {
    id: "about",
    label: "소개",
    children: [
      { id: "skills", label: "기술 스택" },
      { id: "project-summary", label: "프로젝트" },
      { id: "education", label: "교육" },
      { id: "certifications", label: "자격 · 어학" },
    ],
  },
  {
    id: "projects",
    label: "프로젝트 상세",
    children: projects.map((p) => ({ id: `project-${p.slug}`, label: p.name })),
  },
  { id: "this-site", label: "사이트 정보", children: [{ id: "legal-link", label: "법적 고지" }] },
];

// 문장 안의 **굵게** 부분을 강조로 바꾼다
function Rich({ text }: { text: string }) {
  return <>{text.split("**").map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : part))}</>;
}

// 왼쪽에 날짜, 오른쪽에 제목 · 기관을 두는 표 형태 목록. href가 있으면 제목이 같은 페이지 안의 해당 위치로 이동한다
function Rows({ items }: { items: (Credential & { href?: string })[] }) {
  return (
    <ol className="rows">
      {items.map((c) => (
        <li key={c.title}>
          <span className="rows-date">{c.date}</span>
          <span>
            <strong className="rows-title">
              {c.href ? (
                <a href={c.href} className="rows-link">
                  {c.title}
                </a>
              ) : (
                c.title
              )}
            </strong>
            {(c.issuer || c.note) && (
              <span className="rows-sub">{[c.issuer, c.note].filter(Boolean).join(" · ")}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  );
}

// 기술 아이콘: 모두 같은 크기의 단색으로 그린다. 장식이라 스크린 리더에서는 숨긴다
function TechIcon({ name }: { name?: IconName }) {
  if (!name) return <span className="tech-icon" aria-hidden="true" />;
  const icon = icons[name];
  return (
    <svg className="tech-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icon.kind === "fill" ? (
        <path d={icon.d} fill="currentColor" />
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon.shapes.map((s, i) => ("d" in s ? <path key={i} d={s.d} /> : <circle key={i} {...s} />))}
        </g>
      )}
    </svg>
  );
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

// 오른쪽 열의 한 항목: 굵은 세로 막대 + "제목 + 한글 부제" + 설명 + (선택) 큰 숫자
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
    <section id={id} className="entry" data-reveal>
      <div className="entry-body">
        <h2>
          {title} <span className="entry-sub">{subtitle}</span>
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

// 상세 창에 보여 줄 섹션. 내용을 채우기 전에는 개발 서버에서만 빈 틀을 보여 주고, 배포 화면에서는 빈 섹션을 그리지 않는다
function detailSections(p: Project) {
  const filled = p.details?.filter((s) => s.items.length > 0) ?? [];
  if (filled.length > 0) return filled;
  return process.env.NODE_ENV === "development" ? (p.details ?? []) : [];
}

// 상세 창을 열 만한 내용(섹션 · 구성도 · 화면)이 하나라도 있으면 카드를 누를 수 있게 한다
const hasDetail = (p: Project) => detailSections(p).length > 0 || !!p.diagram || !!p.shots?.length;

// 프로젝트 상세 창. 법적 고지와 같은 브라우저 기본 popover라 스크립트 없이 열리고, Esc · 바깥 클릭 · × 로 닫힌다.
// 화면을 거의 채우는 크기로 열리고, 열릴 때의 움직임(떠오르며 커짐 · 블록이 차례로 등장)은 CSS가 맡는다
function ProjectDetail({ project: p }: { project: Project }) {
  const id = `detail-${p.slug}`;
  const sections = detailSections(p);
  let i = 0;
  const step = () => ({ "--i": i++ }) as React.CSSProperties;
  return (
    <div id={id} popover="auto" className="project-detail" aria-labelledby={`${id}-title`}>
      <header className="detail-head">
        <div>
          <p className="detail-meta">
            {p.period} · {p.team} · {p.role}
          </p>
          <h2 id={`${id}-title`}>{p.name}</h2>
          <p className="detail-tagline">{p.tagline}</p>
        </div>
        <button type="button" className="detail-close" popoverTarget={id} popoverTargetAction="hide" aria-label="닫기">
          ×
        </button>
      </header>
      <div className="detail-body">
        <section className="detail-overview" style={step()}>
          <p className="detail-summary">{p.summary}</p>
          <ul className="tags">
            {p.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          {p.links && (
            <p className="project-links">
              {p.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label} ↗
                </a>
              ))}
            </p>
          )}
        </section>

        {p.diagram && (
          <section style={step()}>
            <h3>구성도</h3>
            <ProjectDiagram id={`${id}-arch`} title={`${p.name} 구성도`} diagram={p.diagram} />
            <ol className="detail-steps">
              {p.diagram.steps.map((s) => (
                <li key={s}>
                  <Rich text={s} />
                </li>
              ))}
            </ol>
          </section>
        )}

        {p.shots && p.shots.length > 0 && (
          <section style={step()}>
            <h3>실행 화면</h3>
            <p className="shots-note">화면 속 이름 · 수치 · 기록은 모두 시연용 예시 데이터입니다.</p>
            <ShotGallery id={`${id}-shots`} shots={p.shots} />
          </section>
        )}

        {sections.length > 0 && (
          <div className="detail-sections">
            {sections.map((s) => (
              <section key={s.title} style={step()}>
                <h3>{s.title}</h3>
                {s.items.length > 0 ? (
                  <ul>
                    {s.items.map((item) => (
                      <li key={item}>
                        <Rich text={item} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="draft-note">작성 예정 (개발 서버에서만 보이는 빈 틀)</p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
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
    <div className="layout">
      <Motion />
      <Toc
        items={toc}
        footer={
          <>
            <ThemeToggle />
            <EntryToc />
          </>
        }
      />
      <main className="page">
        <header className="hero">
          {/* 프로필 이미지(움직이는 GIF). 움직임 줄이기를 켠 방문자에게는 정지 이미지를 보여 준다 */}
          <picture className="avatar">
            <source srcSet="/images/profile-still.png" media="(prefers-reduced-motion: reduce)" />
            <img src="/images/profile.gif" alt="" width={112} height={112} />
          </picture>
          <div className="hero-text">
            <h1>
              {profile.name}
              {profile.nameEn && <span className="name-en">{profile.nameEn}</span>}
            </h1>
            <p className="role">{profile.role}</p>
            <p className="headline">
              <Rich text={profile.headline} />
            </p>
          </div>
        </header>

        <div className="resume">
          <aside className="side">
            <div id="contact" className="side-block" data-reveal>
              <h2 className="label">PROFILE / CONTACT</h2>
              <ul className="side-list contact-list">
                <li>
                  <a className="contact" href={profile.github} target="_blank" rel="noopener noreferrer">
                    <TechIcon name="github" />
                    <span>
                      <span className="contact-name">GitHub</span>
                      <span className="contact-value">{profile.github.replace("https://github.com/", "@")}</span>
                    </span>
                  </a>
                </li>
                {profile.email && (
                  <li>
                    <CopyEmail email={profile.email}>
                      <TechIcon name="mail" />
                      <span>
                        <span className="contact-name">Email</span>
                        <span className="contact-value">{profile.email}</span>
                      </span>
                    </CopyEmail>
                  </li>
                )}
              </ul>
            </div>

            <div id="skills" className="side-block" data-reveal>
              <h2 className="label">SKILLS</h2>
              {skills.map((s) => (
                <div key={s.category} className="skill-group">
                  <h3>{s.category}</h3>
                  <ul className="side-list">
                    {s.items.map((i) => (
                      <li key={i.name} className="skill">
                        <TechIcon name={i.icon} />
                        <Level level={i.level} />
                        <span>
                          <span className="skill-name">{i.name}</span>
                          {i.detail && <span className="skill-detail">{i.detail}</span>}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div id="certifications" className="side-block" data-reveal>
              <h2 className="label">CERTIFICATIONS</h2>
              <ul className="side-list">
                {certifications.map((c) => (
                  <li key={c.title}>
                    <span className="skill-name">{c.title}</span>
                    <span className="skill-detail">
                      {[c.note, c.issuer, c.date].filter(Boolean).join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="main-col">
            <Entry id="about" title="About" subtitle="소개">
              <div className="intro">
                {profile.intro.map((p) => (
                  <p key={p}>
                    <Rich text={p} />
                  </p>
                ))}
              </div>
            </Entry>

            <Entry id="project-summary" title="Projects" subtitle="프로젝트" figure={String(projects.length)} unit="개">
              <Rows
                items={projects.map((p) => ({
                  title: p.name,
                  issuer: p.tagline,
                  date: p.period,
                  href: `#project-${p.slug}`,
                }))}
              />
            </Entry>

            <Entry id="education" title="Education" subtitle="교육">
              <Rows items={education} />
            </Entry>
          </div>
        </div>

        <section id="projects" className="block">
          <div data-reveal>
            <RuleTitle>Projects</RuleTitle>
            <p className="section-note">
              카드를 누르면 구성도 · 실행 화면 · 상세 내용을 볼 수 있습니다. 진행 중인 프로젝트는 개발이 계속되고 있어 내용이
              바뀔 수 있습니다.
            </p>
          </div>
          {/* 시간 축이라 과거 → 최근 순서. 아래 카드는 이력서 관례대로 최근 먼저 */}
          <ol className="timeline" aria-label="프로젝트 타임라인" data-reveal>
            {[...projects].reverse().map((p) => (
              <li key={p.name}>
                <span className="dot" aria-hidden="true" />
                <span className="timeline-period">{p.period}</span>
                <span className="timeline-title">{p.name}</span>
              </li>
            ))}
          </ol>
          <div className="project-list">
            {projects.map((p) => (
              <article key={p.name} id={`project-${p.slug}`} className="project" data-reveal data-focus>
                <header>
                  {/* 상세 내용이 있으면 이름 버튼이 카드 전체를 덮어, 카드 어디를 눌러도 상세 창이 열린다 (안의 링크는 위에 떠 있어 따로 눌린다) */}
                  <h3>
                    {hasDetail(p) ? (
                      <button
                        type="button"
                        className="project-open"
                        popoverTarget={`detail-${p.slug}`}
                        aria-label={`${p.name} 자세히 보기`}
                      >
                        {p.name}
                      </button>
                    ) : (
                      p.name
                    )}
                  </h3>
                  <span className="project-period">{p.period}</span>
                </header>
                <p className="project-tagline">{p.tagline}</p>
                <p className="project-summary">{p.summary}</p>
                <dl className="meta">
                  <dt>역할</dt>
                  <dd>{p.role}</dd>
                  <dt>구성</dt>
                  <dd>{p.team}</dd>
                </dl>
                <ul className="highlights">
                  {p.highlights.map((h) => (
                    <li key={h}>
                      <Rich text={h} />
                    </li>
                  ))}
                </ul>
                <ul className="tags">
                  {p.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
                {(p.links || projectLegal[p.slug]) && (
                  <p className="project-links">
                    {p.links?.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                        {l.label} ↗
                      </a>
                    ))}
                    {projectLegal[p.slug] && <LegalLink target={`legal-${p.slug}`} />}
                    {/* 누를 수 있는 카드라는 표시. 실제 동작은 카드 전체를 덮은 이름 버튼이 맡는다 */}
                    {hasDetail(p) && (
                      <span className="project-more" aria-hidden="true">
                        자세히 보기
                      </span>
                    )}
                  </p>
                )}
                {hasDetail(p) && <ProjectDetail project={p} />}
                {projectLegal[p.slug] && (
                  <LegalPopover id={`legal-${p.slug}`} title={`${p.name} 법적 고지`} sections={projectLegal[p.slug]} />
                )}
              </article>
            ))}
          </div>
        </section>

        <section id="this-site" className="block">
          <div data-reveal>
            <RuleTitle>This Site</RuleTitle>
            <p className="site-lead">
              이 이력서 사이트는 AWS 위에 <strong>직접 설계 · 배포 · 운영</strong>하고 있습니다. 인프라는{" "}
              <strong>Terraform 코드</strong>로 관리하고, GitHub에 병합하면{" "}
              <strong>장기 액세스 키 없이 자동으로 배포</strong>됩니다. AWS Organizations로{" "}
              <strong>관리 계정과 워크로드 계정을 분리</strong>하고, IAM 권한은 <strong>작업에 필요한 만큼만</strong>{" "}
              부여했습니다.
            </p>
          </div>
          <div data-reveal>
            <ArchitectureDiagram />
          </div>
          <ul className="site-points" data-reveal>
            <li>
              <strong>서버리스 · HTTPS</strong>
              <span>상시 실행 서버 없이 S3 · CloudFront로 서빙, Route 53 · ACM 인증서로 도메인 연결</span>
            </li>
            <li>
              <strong>코드로 관리</strong>
              <span>사이트 · DNS · 배포 권한 · 예산 리소스를 Terraform으로 생성 · 변경, 적용 전 plan 확인</span>
            </li>
            <li>
              <strong>계정 분리</strong>
              <span>AWS Organizations로 관리 계정과 사이트용 워크로드 계정 분리</span>
            </li>
            <li>
              <strong>사람의 접근</strong>
              <span>IAM Identity Center SSO + MFA만 사용, IAM 사용자 · 장기 액세스 키 0개</span>
            </li>
            <li>
              <strong>최소 권한 배포</strong>
              <span>GitHub Actions OIDC 임시 자격 증명, 사이트 파일 쓰기 · 캐시 무효화 권한만 부여</span>
            </li>
            <li>
              <strong>비용 관리</strong>
              <span>고정 비용은 도메인 · DNS(연 $16 · 월 $0.5)뿐, 나머지는 사용한 만큼만 과금, 월 $5 예산 알림</span>
            </li>
          </ul>
          <EntrySiteCard />
          <p className="project-links">
            <a href={site.repository} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            <LegalLink id="legal-link" target="legal" />
          </p>
        </section>

        <LegalPopover id="legal" title="법적 고지 · 라이선스" sections={legal} />

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
