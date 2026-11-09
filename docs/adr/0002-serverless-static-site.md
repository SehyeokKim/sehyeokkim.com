# 0002. 서버리스(S3 + CloudFront + Lambda) 선택

- 상태: 채택
- 날짜: 2026-10-15

## 배경

- 사이트는 두 부분입니다. 누구나 보는 공개 이력서와, 사이트 주인 1명만 로그인해서 쓰는 비공개 구직 대시보드(`/private`)입니다.
- 공개 이력서는 요청마다 내용이 달라지지 않습니다. 서버에서 화면을 그릴 이유가 없습니다.
- 비공개 대시보드는 로그인과 공고 목록 조회 · 지원 상태 변경만 합니다. 사용자가 1명이라 요청이 적고 드문드문 들어옵니다.
- 이 저장소는 AWS 인프라를 직접 설계 · 배포 · 운영한 과정을 기록하는 자료이기도 합니다. 그래서 구성 요소가 Terraform 코드로 드러나야 합니다.
- 월 예산이 작습니다. 요청이 없어도 켜 둔 시간만큼 과금되는 리소스는 쓰지 않기로 했습니다([ADR 0005](0005-cost-limits.md)).

## 결정

**서버를 두지 않고, 웹은 정적 파일로 S3 + CloudFront에서, API는 API Gateway HTTP API + Lambda로, 데이터는 DynamoDB 온디맨드로 운영합니다.**

| 구성 요소 | 선택 | 코드 |
|---|---|---|
| 웹 | Next.js 정적 export(`output: "export"`, `trailingSlash: true`, `images.unoptimized`). SSR · API 라우트 · 이미지 최적화는 쓰지 않음 | `web/next.config.ts` |
| 정적 파일 저장 | S3 버킷. 퍼블릭 접근 4개 항목 모두 차단, SSE-S3(AES256) 암호화, 객체 소유권 `BucketOwnerEnforced` | `infra/modules/site` |
| 전송 | CloudFront 배포 1개. `PriceClass_200`, HTTP/2 · HTTP/3, IPv6 | `infra/modules/site` |
| 경로 보정 | CloudFront Function(viewer request)이 `/private/` 같은 폴더 경로에 `index.html`을 붙이고, `www`를 루트 도메인으로 301 리다이렉트 | `infra/modules/site/index-rewrite.js` |
| API | API Gateway HTTP API(`ANY /api/{proxy+}`) → Lambda(Python 3.12, arm64, 메모리 256MB, 제한 시간 10초). 앱은 FastAPI이고 Mangum이 Lambda 이벤트를 연결 | `infra/modules/api`, `api/app/main.py` |
| 데이터 | DynamoDB 테이블 1개(`PAY_PER_REQUEST`), `expires_at` TTL, 삭제 방지 | `infra/modules/api` |
| 비밀값 | SSM Parameter Store SecureString. Lambda가 실행 중에 읽고 5분 동안 캐시 | `api/app/config.py` |

CloudFront 하나에서 S3와 API Gateway를 경로로 나누는 방식은 [ADR 0003](0003-cloudfront-single-origin-cookie-auth.md)에 있습니다.

배포 경로도 구성 요소마다 나눕니다([ADR 0006](0006-manual-infra-apply.md)).

| 변경 | 배포 |
|---|---|
| 웹 파일 | `main` 병합 시 `deploy.yml`이 빌드하고 S3에 동기화한 뒤 CloudFront 캐시를 무효화. `_next/static`은 1년 `immutable`, 나머지는 `max-age=0, must-revalidate` |
| Lambda 코드 · 인프라 | `api/scripts/build_lambda.py`로 zip을 만든 뒤 사람이 로컬 SSO로 `terraform apply` |

## 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| EC2 · Lightsail 서버 1대 | 구성은 단순하지만 요청이 없어도 켜 둔 시간만큼 과금됩니다. OS 패치, 웹 서버 설정, 디스크 관리도 직접 맡아야 합니다. |
| ECS(Fargate) + ALB | 컨테이너로 API를 띄울 수 있지만 ALB와 실행 중인 작업이 상시 과금됩니다. 사용자 1명의 드문 요청에는 맞지 않습니다. |
| Amplify Hosting | Next.js 배포가 간편하지만 CloudFront · S3 · 권한 구성이 서비스 안에 감춰집니다. 이 저장소는 그 구성을 Terraform으로 직접 드러내는 것이 목적입니다. |
| Vercel | Next.js의 서버 기능을 쓰기 좋지만, 이 사이트는 서버 기능을 쓰지 않습니다. AWS 밖에 두면 배포 권한(OIDC · 권한 상한선)과 비용 관리도 두 곳으로 나뉩니다. |
| S3 정적 웹사이트 호스팅 엔드포인트 | 폴더의 `index.html`을 자동으로 찾아 주지만, 버킷을 퍼블릭으로 열어야 하고 OAC를 쓸 수 없습니다. 버킷 퍼블릭 차단을 유지하려고 REST 엔드포인트 + CloudFront Function을 택했습니다. |

## 결과

- 요청 · 저장량에 따라서만 과금되는 리소스로 구성되어, 켜 둔 시간으로 과금되는 서버가 없습니다. 고정 비용은 도메인 등록과 호스팅 영역뿐입니다([ADR 0005](0005-cost-limits.md), [ADR 0007](0007-domain-registrar-and-dns-split.md)).
- 관리할 OS · 웹 서버가 없습니다. Lambda 런타임 버전(`python3.12`)과 의존성 업데이트만 챙기면 됩니다.
- 정적 export라 페이지마다 서버에서 데이터를 넣을 수 없습니다. `/private`의 HTML은 공개 정적 파일이고, 공고 데이터는 로그인한 세션으로 `/api/jobs`에서만 받습니다([ADR 0008](0008-google-login-session.md)).
- Lambda는 한동안 요청이 없다가 첫 요청이 오면 실행 환경을 새로 띄우므로 응답이 늦어질 수 있습니다(콜드 스타트). 사용자 1명이 쓰는 비공개 화면이라 감수합니다.
- 웹 변경은 CI가 자동으로 배포하고, Lambda 코드 변경은 사람이 apply할 때 반영됩니다. 화면과 API가 따르는 요청 · 응답 형식은 [API 명세](../api.md)에 둡니다.
