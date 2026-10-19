"use client";

import { useEffect, useState } from "react";

export type TocItem = { id: string; label: string; children?: TocItem[] };

// 화면 위쪽에서 이 거리(px) 안으로 들어온 제목을 "읽는 중"으로 본다
const ACTIVE_OFFSET = 120;

function flatten(items: TocItem[]): string[] {
  return items.flatMap((i) => [i.id, ...flatten(i.children ?? [])]);
}

// 목차: 클릭하면 해당 위치로 이동하고, 스크롤 위치에 맞는 항목을 강조한다
export default function Toc({ items, footer }: { items: TocItem[]; footer?: React.ReactNode }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const ids = flatten(items);
    let frame = 0;

    const update = () => {
      frame = 0;
      let current = ids[0] ?? "";
      let best = -Infinity;
      // 왼쪽 · 오른쪽 열이 나란히 있어 문서 순서와 화면 위치가 다를 수 있으므로 실제 위치로 고른다
      for (const id of ids) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= ACTIVE_OFFSET && top > best) {
          best = top;
          current = id;
        }
      }
      // 맨 아래에 닿으면 마지막 항목
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        current = ids[ids.length - 1] ?? current;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [items]);

  const render = (list: TocItem[]) => (
    <ol>
      {list.map((i) => (
        <li key={i.id}>
          <a href={`#${i.id}`} className={active === i.id ? "active" : undefined}>
            {i.label}
          </a>
          {i.children && render(i.children)}
        </li>
      ))}
    </ol>
  );

  return (
    <nav className="toc" aria-label="목차">
      {render(items)}
      {footer}
    </nav>
  );
}
