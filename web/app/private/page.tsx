import type { Metadata } from "next";
import Link from "next/link";
import { LegalLink, LegalPopover } from "@/app/components/LegalPopover";
import LoginPanel from "@/app/components/LoginPanel";
import PipelineDiagram from "@/app/components/PipelineDiagram";
import { privateDataLegal } from "@/content/legal";

export const metadata: Metadata = {
  title: "비공개 대시보드",
  robots: { index: false, follow: false },
};

// 로그인 입구 겸 설명 화면. 공고 데이터는 로그인한 세션으로만 /api/jobs에서 받는다 (ADR 0008)
export default function PrivatePage() {
  return (
    <main className="private-page">
      <Link href="/" className="private-back">
        ← 이력서로 돌아가기
      </Link>

      <header className="private-head">
        <p className="entry-card-label">PRIVATE AREA</p>
        <h1>비공개 대시보드</h1>
        <p className="private-lead">
          채용 공고를 모아 지원 일정을 관리하는 개인용 화면입니다. Google 로그인으로 제 계정 하나만 들어올 수 있습니다.
        </p>
        <LoginPanel />
      </header>

      <section className="private-section">
        <h2>공개하지 않는 이유</h2>
        <p>
          공고 내용은 각 채용 사이트의 이용약관과 저작권법의 데이터베이스 보호를 받습니다. 대부분의 사이트는 서비스에서
          얻은 정보를 허락 없이 복제하거나 다른 곳에 다시 게시하는 것을 금지합니다. 그래서 이 화면은 개인적 이용 범위에서
          저 혼자 보는 용도로만 만들었고, 수집한 공고는 외부에 공개하지 않습니다. 대신 어떤 기준으로 모으고 어떻게
          동작하는지를 아래에 정리했습니다.
        </p>
        <div className="legal-line">
          <LegalLink target="private-data-legal" label="법적 근거" />
        </div>
        <LegalPopover id="private-data-legal" title="공고 데이터를 공개하지 않는 이유" sections={privateDataLegal} />
      </section>

      <section className="private-section">
        <h2>수집 원칙</h2>
        <ul className="private-rules">
          <li>공식 API를 먼저 씁니다.</li>
          <li>
            API가 없는 사이트는 robots.txt와 이용약관이 자동 수집을 막지 않는 곳만, 로그인 없이 공개 페이지에서
            가져옵니다. 약관이 금지한 사이트는 직접 열어 봅니다.
          </li>
          <li>
            하루 한 번만 요청하고, 403이나 CAPTCHA 같은 차단 신호가 오면 그 사이트는 바로 멈춥니다. 차단을 우회하지
            않습니다.
          </li>
          <li>
            회사명, 공고명, 직무, 지원 자격, 마감일, 지역, 고용형태, 연봉 조건, 원문 링크만 저장합니다. 공고 본문, 복지,
            리뷰, 담당자 개인정보는 저장하지 않습니다.
          </li>
          <li>법률 자문을 받은 것은 아니고, 사이트 약관과 관련 법령 · 판례를 직접 확인해 정한 기준입니다.</li>
        </ul>
      </section>

      <section className="private-section">
        <h2>파이프라인</h2>
        <PipelineDiagram />
        <ol className="private-steps">
          <li>
            <strong>수집</strong> 매일 한 번 수집 Lambda가 돌며, 요청 전에 robots.txt를 확인하고 공식 API와 허용된
            페이지만 조회합니다.
          </li>
          <li>
            <strong>정리</strong> 같은 공고를 묶고 희망 직무(엔지니어 트랙 · SA 경로) · 지역 키워드로 거른 뒤 &quot;새 공고&quot;로 저장합니다.
            직접 정리한 목록은 적재 스크립트가 형식을 검사하고 바뀌는 내용을 보여 준 뒤, 승인해야 저장합니다.
          </li>
          <li>
            <strong>승인</strong> 새 공고는 제가 검토해 지원 후보로 올리거나 제외합니다. 자동으로 모은 결과도 승인한
            것만 후보가 됩니다.
          </li>
          <li>
            <strong>조회</strong> 로그인한 저만 API를 거쳐 목록을 봅니다. 응답은 캐시하지 않습니다.
          </li>
        </ol>
      </section>
    </main>
  );
}
