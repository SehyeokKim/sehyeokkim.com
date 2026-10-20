// 공개 이력서 → 비공개 대시보드(/private/) 입구.
// EntryToc: 본인이 쓰는 입구(목차 맨 아래), EntrySiteCard: 채용 담당자에게 기능을 소개하는 카드(This Site 섹션)
// 샘플 데이터 버튼은 로그인 없이 가짜 공고로 같은 목록 화면을 보여 주는 /private/sample/로 간다

import { LegalLink, LegalPopover } from "@/app/components/LegalPopover";
import { privateDataLegal } from "@/content/legal";

const PRIVATE_HREF = "/private/";
const SAMPLE_HREF = "/private/sample/";

// Lucide "lock" (ISC)
function LockIcon() {
  return (
    <svg className="lock-icon" viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </g>
    </svg>
  );
}

export function EntryToc() {
  return (
    <div className="entry-toc">
      <a href={PRIVATE_HREF}>
        <LockIcon />
        비공개 대시보드
      </a>
    </div>
  );
}

export function EntrySiteCard() {
  return (
    <div className="entry-card">
      <div className="entry-card-text">
        <h3>
          <LockIcon />
          로그인 전용 대시보드
        </h3>
        <p>
          외부 서비스에서 모은 데이터는 저작권 · 이용약관상 공개할 수 없어, Google 로그인으로 권한을 걸고 제 계정
          1개에만 열어 두었습니다. 화면 구성은 샘플 데이터로 둘러볼 수 있습니다.
        </p>
        <div className="legal-line">
          <LegalLink target="private-data-legal" label="법적 근거" />
        </div>
        <ul className="entry-card-impl" aria-label="구현">
          <li>
            <strong>인증</strong> Google 로그인(OIDC), 허용 계정 ID 1개만 통과
          </li>
          <li>
            <strong>API</strong> CloudFront <code>/api/*</code> → API Gateway HTTP API → Lambda(FastAPI)
          </li>
          <li>
            <strong>세션</strong> httpOnly · Secure · SameSite=Strict 쿠키, 브라우저 종료 시 만료
          </li>
          <li>
            <strong>비밀값</strong> SSM Parameter Store SecureString
          </li>
        </ul>
      </div>
      <div className="entry-card-actions">
        <a href={PRIVATE_HREF} className="btn-primary">
          로그인
        </a>
        <a href={SAMPLE_HREF} className="btn-ghost">
          샘플 데이터로 둘러보기
        </a>
      </div>
      <LegalPopover id="private-data-legal" title="공고 데이터를 공개하지 않는 이유" sections={privateDataLegal} />
    </div>
  );
}
