"use client";

import { useState } from "react";
import {
  COMPANY_CHANNEL,
  type Job,
  channelLabel,
  dday,
  fitLabel,
  isWebUrl,
  sourceLabel,
  statusClass,
  statusLabel,
  urlHost,
} from "./jobs";

// 공고 상세: 저장하는 항목만 보여 준다(공고 본문은 저장하지 않음). 지원 완료로 바꿀 때 지원 경로(사이트)를 고른다
export default function JobDetail({
  job,
  channels,
  sample = false,
  onApply,
}: {
  job: Job;
  channels: string[];
  sample?: boolean;
  onApply: (appliedVia: string) => Promise<boolean>;
}) {
  const [via, setVia] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function submit() {
    if (!via) return;
    setSaving(true);
    setError(false);
    const ok = await onApply(via);
    setSaving(false);
    setError(!ok);
  }

  const rows: [string, React.ReactNode][] = [
    ["상태", <span key="s" className={statusClass[job.status]}>{statusLabel[job.status]}</span>],
    ["적합도", job.fit ? fitLabel[job.fit].replace("적합도 ", "") : "정하지 않음"],
    ["마감", job.deadline ? `${job.deadline} (${dday(job.deadline)})` : "상시"],
    ["지역", job.location ?? "없음"],
    ["고용형태", job.employment_type ?? "없음"],
    ["출처", sourceLabel[job.source] ?? job.source],
    ["수집일", job.collected_at],
    ["메모", job.memo ?? "없음"],
    [
      "원문",
      isWebUrl(job.url) ? (
        <a key="u" href={job.url} target="_blank" rel="noopener noreferrer">
          {urlHost(job.url)} ↗
        </a>
      ) : (
        "없음"
      ),
    ],
  ];
  if (job.status === "applied") {
    rows.push(["지원일", job.applied_at ?? "기록 없음"]);
    rows.push(["지원 경로", job.applied_via ? channelLabel(job.applied_via) : "기록 없음"]);
  }

  const listId = `apply-channels-${job.id}`;

  return (
    <div className="job-detail-body">
      <dl className="job-fields">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      {job.status !== "applied" && (
        <div className="job-apply">
          <span className="job-apply-label">지원 경로</span>
          <div className="job-apply-row">
            <button
              type="button"
              className="btn-ghost job-channel-toggle"
              aria-expanded={picking}
              aria-controls={listId}
              onClick={() => setPicking(!picking)}
            >
              {via ? channelLabel(via) : "지원한 사이트 고르기"} {picking ? "▴" : "▾"}
            </button>
            <button type="button" className="btn-primary" disabled={!via || saving} onClick={submit}>
              {saving ? "저장 중" : "지원 완료로 표시"}
            </button>
          </div>
          {picking && (
            <ul id={listId} className="job-channels" aria-label="지원 경로">
              {channels.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className="job-channel"
                    aria-pressed={via === c}
                    onClick={() => {
                      setVia(c);
                      setPicking(false);
                    }}
                  >
                    {channelLabel(c)}
                    {c === COMPANY_CHANNEL && <span className="job-channel-domain">공고 원문이 아닌 회사 사이트</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="job-apply-error" role="alert">
              저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.
            </p>
          )}
        </div>
      )}

      {sample && <p className="job-sample-note">예시 공고라 바꾼 상태가 저장되지 않고, 새로고침하면 처음으로 돌아갑니다.</p>}
    </div>
  );
}
