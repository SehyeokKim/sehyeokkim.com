"use client";

// 공고 목록 머리글 오른쪽 위의 작은 로그아웃 링크 (자주 쓰지 않아 눈에 덜 띄게)
export default function LogoutButton() {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
    window.location.replace("/private/");
  }

  return (
    <button type="button" className="text-link private-logout" onClick={logout}>
      로그아웃
    </button>
  );
}
