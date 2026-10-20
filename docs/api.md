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

저장하지 않는 것: 공고 본문, 리뷰 원문, 채용 담당자 개인정보.

## DynamoDB

| 항목 | 값 |
|---|---|
| 테이블 | `sehyeokkim-jobs` (온디맨드) |
| 파티션 키 | `id` (문자열) |
| TTL | `expires_at` (유닉스 초). 마감일 30일 뒤 자동 삭제, 상시 공고는 수집일 90일 뒤 |
| 조회 | 공고 수가 수백 건 이하라 `Scan` 후 정렬. 늘어나면 상태별 인덱스를 추가 |
