"use client";

import { useEffect } from "react";

// 스크롤 애니메이션. 화면 요소는 그리지 않고, 표시된 요소에 클래스 · CSS 변수만 붙인다.
// - [data-reveal]: 아래로 스크롤해 화면에 들어올 때 떠오르며 나타난다 (위로 되돌아가 화면 아래로 빠지면 다시 숨긴다)
// - [data-focus]: 아래에서 들어오는 카드가 화면을 차지하는 비율만큼 --focus(0–1)를 갱신한다. CSS가 이 값으로 크기 · 진하기를 바꾼다
// JavaScript가 없거나 "움직임 줄이기"를 켠 방문자에게는 아무 효과 없이 모든 내용이 그대로 보인다.

// 화면을 이 비율 이상 차지하면 완전히 강조, 이 비율 이하면 강조 없음
const FOCUS_FULL = 0.85;
const FOCUS_NONE = 0.35;

export default function Motion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = document.documentElement;
    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const focuses = Array.from(document.querySelectorAll<HTMLElement>("[data-focus]"));

    // 화면 안이나 화면 위(이미 지나온 곳)에 있는 요소는 처음부터 보이게 둔다.
    // 깜빡임을 막고, #링크로 중간에 들어온 뒤 위로 올릴 때도 효과가 돌지 않게 한다
    const vh = window.innerHeight;
    for (const el of reveals) {
      if (el.getBoundingClientRect().top < vh) el.classList.add("is-visible");
    }
    root.classList.add("motion-ready");

    // 들어올 때: 화면 아래 10%를 뺀 영역에 10% 이상 보이면 나타난다
    const showObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) e.target.classList.add("is-visible");
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    // 나갈 때: 화면 "아래"로 완전히 벗어났을 때만(위로 스크롤해 되돌아간 경우) 다시 숨긴다.
    // 그래서 아래로 내릴 때만 효과가 돌고, 위로 올릴 때는 위에서 내려오는 블록이 이미 보이는 상태로 그대로 있다
    const hideObserver = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const below = e.boundingClientRect.top >= (e.rootBounds?.bottom ?? window.innerHeight);
        if (!e.isIntersecting && below) e.target.classList.remove("is-visible");
      }
    });
    for (const el of reveals) {
      showObserver.observe(el);
      hideObserver.observe(el);
    }

    // 화면 점유율 = 보이는 높이 / (요소 높이와 화면 높이 중 작은 값). 화면보다 긴 카드도 1까지 올라간다
    let frame = 0;
    const update = () => {
      frame = 0;
      const h = window.innerHeight;
      for (const el of focuses) {
        const r = el.getBoundingClientRect();
        const visible = Math.max(0, Math.min(r.bottom, h) - Math.max(r.top, 0));
        const share = visible / Math.max(1, Math.min(r.height, h));
        // 화면 위쪽에 걸친 카드(이미 지나온 카드)는 원래 크기로 둔다. 아래에서 들어오는 카드만 커지며 나타난다
        const focus =
          r.top < 0 ? 1 : Math.min(1, Math.max(0, (share - FOCUS_NONE) / (FOCUS_FULL - FOCUS_NONE)));
        el.style.setProperty("--focus", focus.toFixed(3));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      showObserver.disconnect();
      hideObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
      root.classList.remove("motion-ready");
    };
  }, []);

  return null;
}
