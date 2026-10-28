"use client";

import { useEffect, useId, useRef, useState } from "react";

export type MultiOption<T extends string> = { value: T; label: string; count: number };

// 여러 값을 고르는 드롭다운. 아무것도 고르지 않으면 "전체"(거르지 않음)
// 기본 select는 multiple일 때 목록 상자로 펼쳐져 한 줄 툴바에 맞지 않아, 버튼 + 체크박스 목록으로 만든다
export default function MultiSelect<T extends string>({
  label,
  allLabel,
  options,
  selected,
  onChange,
}: {
  label: string;
  allLabel: string;
  options: MultiOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  // 바깥을 누르거나 포커스가 밖으로 나가면 닫는다. Esc는 닫고 버튼으로 포커스를 돌려준다
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle(value: T) {
    // 고른 순서가 아니라 선택지 순서로 둔다 (버튼 글자가 늘 같은 순서로 보이게)
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    onChange(options.map((o) => o.value).filter((v) => next.includes(v)));
  }

  const chosen = options.filter((o) => selected.includes(o.value));
  const summary =
    chosen.length === 0 ? allLabel : chosen.length === 1 ? chosen[0].label : `${chosen[0].label} 외 ${chosen.length - 1}`;

  return (
    <div
      ref={root}
      className="jobs-multi"
      onBlur={(e) => {
        if (!root.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        className={chosen.length > 0 ? "jobs-select is-active" : "jobs-select"}
        aria-label={`${label}: ${summary}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {summary}
      </button>
      {open && (
        <div id={panelId} className="jobs-multi-panel" role="group" aria-label={label}>
          {options.map((o) => (
            <label key={o.value} className="jobs-multi-option">
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
              <span>{o.label}</span>
              <span className="jobs-multi-count">{o.count}</span>
            </label>
          ))}
          <button
            type="button"
            className="jobs-multi-clear"
            disabled={chosen.length === 0}
            onClick={() => onChange([])}
          >
            선택 해제 ({allLabel})
          </button>
        </div>
      )}
    </div>
  );
}
