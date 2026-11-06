"use client";

// 프로젝트 상세 창의 실행 화면 목록. 캡처를 누르면 상세 창 위에 크게 보는 창이 하나 더 뜬다.
// 크게 보는 창은 상세 창 안에 둔 popover라 상세 창은 열린 채로 남는다. 창이 화면 전체를 덮으므로
// 어두운 바깥을 누르면 이 창만 닫고(아래 onClick), Esc는 브라우저가 맨 위 창부터 닫는다.
import { useRef, useState } from "react";
import type { Project } from "@/content/resume";

type Shot = NonNullable<Project["shots"]>[number];

// 캡처 파일 크기는 두 가지로 맞춰 두었다(가로 1400×875, 모바일 780×1688). 자리를 미리 잡아 불러올 때 화면이 밀리지 않게 한다
const size = (s: Shot) => (s.phone ? { width: 780, height: 1688 } : { width: 1400, height: 875 });

export default function ShotGallery({ id, shots }: { id: string; shots: Shot[] }) {
  const viewer = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [current, setCurrent] = useState<Shot | null>(null);

  // 열면 닫기 버튼으로 키보드 초점을 옮기고, 닫히면(바깥 클릭 · × · Esc 모두) 누른 캡처로 되돌린다
  const open = (s: Shot, button: HTMLButtonElement) => {
    opener.current = button;
    setCurrent(s);
    viewer.current?.showPopover();
    closeButton.current?.focus();
  };
  const close = () => viewer.current?.hidePopover();

  const list = (items: Shot[], className: string) =>
    items.length > 0 && (
      <div className={className}>
        {items.map((s) => (
          <figure key={s.src}>
            <button type="button" className="shot-open" onClick={(e) => open(s, e.currentTarget)} aria-label={`${s.caption} 크게 보기`}>
              <img src={s.src} alt={s.caption} {...size(s)} loading="lazy" decoding="async" />
            </button>
            <figcaption>{s.caption}</figcaption>
          </figure>
        ))}
      </div>
    );

  return (
    <>
      {list(
        shots.filter((s) => !s.phone),
        "shots-wide",
      )}
      {list(
        shots.filter((s) => s.phone),
        "shots-phone",
      )}
      <div
        id={id}
        ref={viewer}
        popover="auto"
        className="shot-viewer"
        aria-label={current?.caption ?? "실행 화면"}
        onToggle={(e) => {
          if (e.newState === "closed") opener.current?.focus();
        }}
        onClick={(e) => {
          // 이미지 · 설명 · 닫기 버튼 밖(어두운 바깥)을 누르면 닫는다
          if (e.target === e.currentTarget) close();
        }}
      >
        {current && (
          <figure className={current.phone ? "phone" : undefined}>
            <img src={current.src} alt={current.caption} {...size(current)} />
            <figcaption>
              <span className="shot-badge">예시 화면</span>
              {current.caption}
            </figcaption>
          </figure>
        )}
        <button ref={closeButton} type="button" className="shot-close" onClick={close} aria-label="닫기">
          ×
        </button>
      </div>
    </>
  );
}
