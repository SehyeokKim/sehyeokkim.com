import type { LegalSection } from "@/content/legal";

// 법적 고지 링크 + 작은 창. 브라우저 기본 popover라 스크립트 없이 열리고, Esc · 바깥 클릭으로 닫힌다
export function LegalLink({
  target,
  id,
  label = "법적 고지 · 라이선스",
}: {
  target: string;
  id?: string;
  label?: string;
}) {
  return (
    <button id={id} type="button" className="text-link" popoverTarget={target}>
      {label} ↗
    </button>
  );
}

export function LegalPopover({ id, title, sections }: { id: string; title: string; sections: LegalSection[] }) {
  return (
    <div id={id} popover="auto" className="legal" aria-labelledby={`${id}-title`}>
      <header className="legal-head">
        <h2 id={`${id}-title`}>{title}</h2>
        <button type="button" className="legal-close" popoverTarget={id} popoverTargetAction="hide" aria-label="닫기">
          ×
        </button>
      </header>
      {sections.map((sec) => (
        <section key={sec.title}>
          <h3>{sec.title}</h3>
          <ul>
            {sec.items.map((i) => (
              <li key={i.text}>
                {i.text}
                {i.basis && <span className="legal-basis">근거: {i.basis}</span>}
                {i.href && (
                  <>
                    {" "}
                    <a href={i.href} target="_blank" rel="noopener noreferrer">
                      링크 ↗
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
