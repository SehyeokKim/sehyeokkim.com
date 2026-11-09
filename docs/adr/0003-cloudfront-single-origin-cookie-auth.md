# 0003. CloudFront 단일 출처 + httpOnly 쿠키 인증

- 상태: 채택
- 날짜: 2026-10-15

## 배경

- 웹은 S3의 정적 파일이고 API는 API Gateway + Lambda입니다([ADR 0002](0002-serverless-static-site.md)). 그대로 두면 브라우저가 보기에 두 주소는 서로 다른 출처입니다.
- 출처가 다르면 화면에서 API를 부를 때 CORS 설정이 필요하고, 쿠키를 함께 보내려면 허용 출처와 `credentials` 설정까지 맞춰야 합니다. 설정이 틀리면 다른 출처에 응답이 열립니다.
- 비공개 대시보드는 로그인 세션이 필요합니다. 세션 토큰을 페이지 스크립트가 읽을 수 있는 곳에 두면, 스크립트 삽입(XSS) 한 번으로 토큰이 밖으로 나갈 수 있습니다.
- S3 버킷은 퍼블릭 접근을 모두 막고 CloudFront로만 읽게 하려고 합니다.

## 결정

**CloudFront 배포 하나에 S3와 API Gateway를 오리진으로 두고 `/api/*` 경로로 나눕니다. 화면과 API가 같은 출처(`https://sehyeokkim.com`)가 되므로, 세션은 이 출처에만 붙는 httpOnly 쿠키로 주고받고 CORS는 두지 않습니다.**

| 경로 | 오리진 | 동작 |
|---|---|---|
| 기본(`/*`) | S3 버킷, OAC(SigV4 서명) 전용 | `GET` · `HEAD`만. 캐시 정책 `Managed-CachingOptimized`. viewer request에서 CloudFront Function이 `index.html` 경로를 보정 |
| `/api/*` | API Gateway HTTP API(`https-only`, TLSv1.2) → Lambda | 모든 메서드 허용. 캐시 정책 `Managed-CachingDisabled`, 오리진 요청 정책 `Managed-AllViewerExceptHostHeader`(Host를 뺀 헤더 · 쿠키 · 쿼리를 그대로 전달) |

두 경로 모두 HTTP를 HTTPS로 리다이렉트하고, 같은 응답 헤더 정책을 붙입니다: HSTS(`max-age=63072000`, 하위 도메인 포함), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

S3 접근은 다음으로 제한합니다.

- 버킷의 퍼블릭 접근 차단 4개 항목을 모두 켭니다.
- 버킷 정책은 `cloudfront.amazonaws.com`에만 `s3:GetObject` · `s3:ListBucket`을 허용하고, `AWS:SourceArn`을 이 배포로 고정합니다. 다른 CloudFront 배포는 이 버킷을 읽을 수 없습니다.
- `s3:ListBucket`은 없는 파일을 요청했을 때 S3가 403 대신 404를 돌려주게 하려고 허용합니다.
- TLS가 아닌 요청(`aws:SecureTransport = false`)은 모두 거부합니다.

세션 쿠키와 API 응답은 다음 규칙을 따릅니다. 로그인 흐름 자체는 [ADR 0008](0008-google-login-session.md)에 있습니다.

| 항목 | 값 |
|---|---|
| 세션 쿠키 | 이름 `session`, `HttpOnly` · `Secure` · `SameSite=Strict` · `Path=/api`. `Max-Age` · `Expires`가 없어 브라우저를 끄면 사라짐 |
| 세션 내용 | HS256 JWT. 인증된 요청마다 만료를 2시간 뒤로 다시 발급하고, 처음 로그인부터 12시간이 지나면 401 |
| 로그인 임시 쿠키 | 이름 `oauth_tx`, `SameSite=Lax` · `Path=/api/auth`, 10분. Google에서 돌아오는 이동은 다른 사이트에서 시작되므로 `Strict`로는 쿠키가 따라오지 않음 |
| 쓰기 요청 확인 | `PATCH /api/jobs/{id}`는 세션과 함께 `Origin` 헤더가 사이트 주소와 같은지 확인. 다르면 401 |
| API 응답 헤더 | 모든 응답에 `Cache-Control: no-store`, `X-Robots-Tag: noindex` |
| 인증 실패 코드 | 401. 배포 전체에 403 · 404를 `/404.html`(상태 404)로 바꾸는 오류 응답 설정이 있어, 403을 쓰면 API 응답이 HTML 페이지로 바뀜 |
| 남용 방지 | API Gateway `$default` 스테이지 요청 제한: 초당 10, 순간 20 |
| 검색 차단 | `robots.txt`에서 `/private/`, `/api/` 차단 |

## 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| API를 별도 주소(`api.sehyeokkim.com` 또는 API Gateway 기본 주소 `*.execute-api.*`)에 두고 CORS 허용 | 화면과 API를 따로 배포할 수 있지만, 허용 출처 · `credentials` · 프리플라이트(`OPTIONS`) 설정을 API 쪽에서 계속 맞춰야 합니다. 별도 하위 도메인이면 DNS 레코드와 인증서 대상도 늘어납니다. 같은 출처면 이 설정이 모두 필요 없습니다. |
| 토큰을 `localStorage`에 두고 `Authorization: Bearer` 헤더로 전송 | CSRF 걱정은 줄지만 페이지 스크립트가 토큰을 읽을 수 있어 XSS에 그대로 노출됩니다. `localStorage`는 브라우저를 꺼도 남으므로 세션 종료도 따로 구현해야 합니다. |

## 결과

- API에 CORS 설정이 없습니다. FastAPI에 CORS 미들웨어가 없고, API Gateway에도 CORS 구성이 없습니다.
- 세션 쿠키는 `sehyeokkim.com`의 `/api` 경로에만 붙고 스크립트에서 읽을 수 없습니다. 다른 사이트에서 시작된 요청에는 `SameSite=Strict` 때문에 쿠키가 실리지 않고, 쓰기 요청은 `Origin` 확인을 한 번 더 거칩니다.
- API Gateway 기본 주소는 막혀 있지 않아 직접 요청할 수 있습니다. 하지만 세션 쿠키가 그 주소에는 붙지 않아 인증이 필요한 API는 401을 돌려주고, 요청 제한도 같은 스테이지에 걸립니다.
- 오류 응답 설정이 `/api/*`에도 적용되므로, API가 404를 돌려주면 상태 코드는 404로 남고 본문은 `404.html`로 바뀝니다. API는 403을 쓰지 않습니다.
- `/api/*` 응답은 CloudFront가 캐시하지 않고, Lambda도 `no-store`를 붙여 브라우저 캐시에 남지 않습니다.
- S3 오리진은 처음 사이트 모듈(#9)에서 만들었고, `/api/*` 오리진과 동작은 API를 추가한 #18에서 붙였습니다. `api_domain_name`이 없으면 API 오리진 없이 정적 사이트만 배포됩니다.
