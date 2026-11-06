"use client";

import { useRef, useSyncExternalStore } from "react";

// 화면 테마 선택. 목차 아래 "테마 설정"을 누르면 작은 창(시스템 · 라이트 · 다크)이 뜨고, 칸을 누르면 바로 바뀐다.
// 고른 값은 localStorage에 두고, layout.tsx의 <head> 스크립트가 그리기 전에 <html data-theme>으로 옮긴다
type Choice = "system" | "light" | "dark";

const KEY = "theme";
const listeners = new Set<() => void>();

function read(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function apply(choice: Choice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;

  // 주소창 색(theme-color)은 OS 설정 기준 두 값만 있으므로, 직접 고르면 지금 배경색으로 맞추고 시스템으로 돌아가면 원래 값을 되돌린다
  const bg = getComputedStyle(document.body).backgroundColor;
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.dataset.original ??= m.content;
    m.content = choice === "system" ? m.dataset.original : bg;
  });
}

function subscribe(onChange: () => void) {
  // 다른 탭에서 바꾸면 이 탭도 따라간다
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    apply(read());
    onChange();
  };
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function choose(choice: Choice) {
  try {
    if (choice === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, choice);
  } catch {
    // 저장이 막힌 브라우저에서는 이 페이지에서만 바뀐다
  }
  apply(choice);
  listeners.forEach((l) => l());
}

// Lucide "monitor" · "sun" · "moon" (ISC)
const icons: Record<Choice, React.ReactNode> = {
  system: (
    <>
      <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </>
  ),
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </>
  ),
  dark: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
};

const options: { value: Choice; label: string }[] = [
  { value: "system", label: "시스템 설정" },
  { value: "light", label: "라이트" },
  { value: "dark", label: "다크" },
];

const POPOVER_ID = "theme-popover";

export default function ThemeToggle() {
  // 서버에서 그릴 때는 저장된 값을 모르므로 아무것도 눌리지 않은 상태로 두고, 브라우저에서 바로 채운다
  const current = useSyncExternalStore<Choice | null>(subscribe, read, () => null);
  const trigger = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // 브라우저 기본 popover라 Esc · 바깥 클릭으로 닫힌다. 화면 맨 위 층에 뜨므로 목차 스크롤 영역에 잘리지 않고,
  // 위치만 열 때마다 "테마 설정" 글자 바로 위로 맞춘다 (목차가 화면에 고정돼 있어 연 동안 어긋나지 않는다)
  const place = (e: React.ToggleEvent<HTMLDivElement>) => {
    if (e.newState !== "open" || !trigger.current || !box.current) return;
    const r = trigger.current.getBoundingClientRect();
    box.current.style.left = `${r.left}px`;
    box.current.style.bottom = `${window.innerHeight - r.top + 8}px`;
  };

  return (
    <div className="theme-setting">
      <button ref={trigger} type="button" className="theme-setting-open" popoverTarget={POPOVER_ID}>
        테마 설정
      </button>
      <div
        ref={box}
        id={POPOVER_ID}
        popover="auto"
        className="theme-toggle"
        role="group"
        aria-label="화면 테마"
        onBeforeToggle={place}
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-label={o.label}
            title={o.label}
            aria-pressed={current === o.value}
            onClick={() => choose(o.value)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {icons[o.value]}
              </g>
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
