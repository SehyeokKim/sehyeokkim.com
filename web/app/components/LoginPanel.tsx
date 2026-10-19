"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

// /private 로그인 버튼. 이미 로그인돼 있으면 목록으로 가는 링크를, 로그인에 실패하고 돌아왔으면 이유를 보여 준다
const messages: Record<string, string> = {
  denied: "허용되지 않은 계정입니다. 이 화면은 사이트 주인 계정만 로그인할 수 있습니다.",
  login: "로그인을 끝내지 못했습니다. 다시 시도해 주세요.",
  expired: "로그인이 만료됐습니다. 다시 로그인해 주세요.",
};

const noSubscribe = () => () => {};

export default function LoginPanel() {
  // 정적 HTML에는 쿼리가 없으므로 서버 값은 빈 문자열, 브라우저에서만 실제 주소를 읽는다
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const error = new URLSearchParams(search).get("error");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
      .then((res) => setSignedIn(res.ok))
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <div className="login-panel">
      {error && messages[error] && (
        <p className="notice" role="alert">
          {messages[error]}
        </p>
      )}
      {signedIn ? (
        <a href="/private/jobs/" className="btn-primary">
          공고 목록 보기
        </a>
      ) : (
        <a href="/api/auth/login" className="btn-primary">
          Google 계정으로 로그인
        </a>
      )}
    </div>
  );
}
