"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 이메일 연락처: 누르면 메일 앱 대신 주소를 복사하고, 누른 자리에 작은 알림을 띄운다.
// 링크(mailto:)는 그대로 둬서 스크립트가 동작하지 않으면 예전처럼 메일 앱이 열린다.

type Toast = { x: number; y: number; ok: boolean; key: number };

// 클립보드 API가 막힌 환경(오래된 브라우저 · 권한 거부)에서는 선택 후 복사 명령으로 한 번 더 시도한다
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

export default function CopyEmail({ email, children }: { email: string; children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  // 알림은 잠깐 보여 준 뒤 지운다 (CSS 애니메이션 길이와 맞춘다)
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(timer);
  }, [toast]);

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    // 키보드(Enter)로 누르면 마우스 위치가 없으므로 버튼 가운데에 띄운다
    const box = e.currentTarget.getBoundingClientRect();
    const fromKeyboard = e.clientX === 0 && e.clientY === 0;
    const x = fromKeyboard ? box.left + box.width / 2 : e.clientX;
    const y = fromKeyboard ? box.top : e.clientY;
    const ok = await copy(email);
    setToast({ x, y, ok, key: Date.now() });
  };

  return (
    <>
      <a className="contact" href={`mailto:${email}`} onClick={onClick} title="눌러서 이메일 주소 복사">
        {children}
      </a>
      {/* 스크린 리더에도 결과를 알린다. 알림은 화면 맨 위층(body)에 띄워 카드 애니메이션의 영향을 받지 않게 한다 */}
      {toast &&
        createPortal(
          <span
            key={toast.key}
            className={toast.ok ? "copy-toast" : "copy-toast fail"}
            style={{ left: toast.x, top: toast.y }}
            role="status"
          >
            {toast.ok ? "이메일 주소를 복사했어요" : "복사하지 못했어요"}
          </span>,
          document.body,
        )}
    </>
  );
}
