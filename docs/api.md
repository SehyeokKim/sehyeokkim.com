# API 명세

- 기본 주소: `https://sehyeokkim.com/api` (CloudFront `/api/*` → API Gateway HTTP API → Lambda)
- 모든 응답에 `Cache-Control: no-store`
- 인증이 필요한 API는 세션 쿠키가 없거나 만료되면 `401 {"detail": "unauthorized"}`
- 로그인 흐름과 세션 규칙: [ADR 0008](adr/0008-google-login-session.md)

## 인증

| 메서드 · 경로 | 설명 | 응답 |
|---|---|---|
| `GET /api/auth/login` | Google 로그인 시작. `state` · `nonce` · PKCE 값을 임시 쿠키에 두고 Google로 보냄 | `302` → `accounts.google.com` |
| `GET /api/auth/callback` | Google이 돌려보내는 주소. 임시 쿠키와 `state`를 비교하고, 코드를 토큰으로 바꿔 ID 토큰을 검증 | 허용 계정: `302` → `/private/jobs/` + 세션 쿠키<br>다른 계정: `302` → `/private/?error=denied`<br>그 밖의 실패: `302` → `/private/?error=login`<br>허용 계정 미설정: `200` 설정 안내 HTML |
| `POST /api/auth/logout` | 세션 쿠키 삭제 | `204` |
| `GET /api/me` | 로그인 여부 확인 | `200 {"authenticated": true}` 또는 `401` |

## 공고

### `GET /api/jobs`

로그인한 사용자의 공고 목록. 마감일이 빠른 순, 마감일이 없는 공고(상시)는 뒤.

```json
{
  "items": [
    {
      "id": "sample-001",
      "company": "예시회사",
      "title": "클라우드 엔지니어 신입",
      "url": "https://example.com/jobs/1",
      "deadline": "2026-10-31",
      "location": "서울",
      "employment_type": "정규직",
      "source": "manual",
      "status": "candidate",
      "fit": "high",
      "memo": "AWS 우대",
      "collected_at": "2026-10-19"
    }
  ]
}
```

| 필드 | 형식 | 설명 |
|---|---|---|
| `id` | 문자열 | 공고 ID (출처 사이트의 공고 번호 등) |
| `company`, `title` | 문자열 | 회사명, 공고명 |
| `url` | URL | 원문 링크. 공고 본문은 저장하지 않음 |
| `deadline` | `YYYY-MM-DD` 또는 `null` | 마감일. `null`은 상시 · 채용 시 마감 |
| `location`, `employment_type` | 문자열 또는 `null` | 지역, 고용형태 |
| `source` | 문자열 | 출처 (`manual`, API 이름 등) |
| `status` | `new` · `candidate` · `applied` · `excluded` | 새 공고 · 지원 후보 · 지원 완료 · 제외 |
| `fit` | `high` · `mid` · `low` 또는 `null` | 적합도 (사람이 정하거나 검토한 값) |
| `memo` | 문자열 또는 `null` | 본인 메모 |
| `collected_at` | `YYYY-MM-DD` | 수집일 |
| `role` | 문자열 또는 `null` (80자 이하) | 직무. 예: `클라우드 엔지니어`, `DevOps · SRE` |
| `career` | 문자열 또는 `null` (80자 이하) | 지원 자격. 예: `신입`, `신입 · 경력`, `인턴(채용연계형)` |
| `salary` | 문자열 또는 `null` (80자 이하) | 연봉 조건과 출처. 예: `3,600만 원 (공고)`, `약 6,330만 원 (국민연금 재직자 평균, 초봉 아님)`. 근거가 없으면 `null` |
| `applied_at` | `YYYY-MM-DD` 또는 `null` | 지원일. 지원 완료로 바꿀 때 서버가 오늘 날짜(KST)로 기록 |
| `applied_via` | 문자열 또는 `null` | 지원 경로. 공고 원문의 도메인(예: `jobs.example.com`) 또는 `company`(회사 채용 페이지) |

저장하지 않는 것: 공고 본문, 복지, 리뷰 원문, 채용 담당자 개인정보.

### `PATCH /api/jobs/{id}`

공고를 지원 완료로 바꾸고 지원 경로를 남긴다. 지금은 지원 완료만 받는다.

```json
{ "status": "applied", "applied_via": "jobs.example.com" }
```

| 응답 | 경우 |
|---|---|
| `200` + 바뀐 공고 (`GET /api/jobs`의 항목과 같은 형식) | 성공 |
| `401` | 세션이 없거나 만료됨, 또는 `Origin`이 사이트 주소(`https://sehyeokkim.com`)가 아님 |
| `404` | 없는 공고 (새로 만들지 않음) |
| `422` | `status`가 `applied`가 아니거나, `applied_via`가 도메인 · `company` 형식이 아니거나, 다른 필드가 있음 |

- 화면의 지원 경로 선택지는 목록에 있는 공고들의 원문 도메인 + `company`다. 사이트 목록을 코드에 두지 않는다.
- 바꾸는 속성은 `status`, `applied_at`, `applied_via`뿐이다. DynamoDB `UpdateItem`에 `attribute_exists(id)` 조건을 걸어 없는 공고는 만들지 않는다.

## DynamoDB

| 항목 | 값 |
|---|---|
| 테이블 | `sehyeokkim-jobs` (온디맨드) |
| 파티션 키 | `id` (문자열) |
| TTL | `expires_at` (유닉스 초). 마감일 30일 뒤 자동 삭제, 상시 공고는 수집일 90일 뒤 |
| 조회 | 공고 수가 수백 건 이하라 `Scan` 후 정렬. 늘어나면 상태별 인덱스를 추가 |
