# sehyeokkim.com

김세혁의 이력서·포트폴리오 사이트입니다. 사이트 자체를 AWS 위에 직접 설계·배포·운영하며, 이 저장소에 그 과정(IaC, CI/CD, 보안, 비용 관리)을 기록합니다.

**사이트**: https://sehyeokkim.com

> 🚧 작업 중입니다. 공개 이력서는 화면을 갖췄고, 로그인 후 화면(`/private`)과 API를 만들고 있습니다.

## 무엇이 있나

| 영역 | 설명 |
|---|---|
| 공개 이력서 | 누구나 볼 수 있는 이력서·프로젝트 소개 페이지 |
| 비공개 영역 (`/private`) | 소유자 1명만 Google 로그인으로 들어가는 구직 공고 대시보드. 공고는 각 사이트 약관상 공개하지 않고, 수집 원칙과 파이프라인만 공개 (검색 엔진 차단) |

## 아키텍처

```
          Route 53 (sehyeokkim.com → CloudFront 별칭, ACM 인증서)
                 ┌──────────────── CloudFront ────────────────┐
브라우저 ──HTTPS──▶│  /*      → S3 (정적 사이트, OAC 전용 접근)  │
                 │  /api/*  → API Gateway (HTTP API) → Lambda  │──▶ DynamoDB
                 └─────────────────────────────────────────────┘        SSM Parameter Store
```

- **단일 출처**: CloudFront 하나 아래에 정적 사이트와 API를 함께 두어 CORS 없이 httpOnly 쿠키 인증을 사용합니다.
- **서버리스**: 상시 과금 리소스 없이 S3 · CloudFront · Lambda · DynamoDB 온디맨드만 사용합니다.
- **도메인**: 등록은 관리 계정, 호스팅 영역 · 인증서 · 레코드는 워크로드 계정의 Terraform이 관리하고 네임서버 위임으로 연결합니다. `www`는 루트 도메인으로 301 리다이렉트합니다.
- **인증**: 사용자 1명. Google 로그인(OIDC)을 Lambda가 직접 처리하고 허용된 계정 1개만 통과합니다. 비밀번호는 저장하지 않으며, Google client secret · JWT 서명 키 · 허용 계정 ID는 SSM Parameter Store(SecureString)에 둡니다 ([ADR 0008](docs/adr/0008-google-login-session.md)).

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 웹 | Next.js (정적 export), TypeScript, Pretendard 글꼴 |
| API | Python, FastAPI + Mangum (Lambda) |
| 데이터 | DynamoDB (온디맨드) |
| 인프라 | Terraform (S3 백엔드, `use_lockfile`), AWS `ap-northeast-2` |
| CI/CD | GitHub Actions + OIDC (장기 액세스 키 없음) |

## 저장소 구조

```
web/          Next.js 정적 사이트
api/          Python Lambda (FastAPI)
infra/        Terraform — bootstrap / modules / envs/prod
data/sample/  공개 데모용 가짜 데이터
docs/         아키텍처 문서, API 명세(api.md), ADR(설계 결정 기록)
.github/      CI(PR 검사) · 배포 워크플로
```

## 설계 결정 (ADR)

`docs/adr/`에 배경 · 결정 · 대안 · 결과를 기록합니다.

- [0001 브랜치 전략: GitHub Flow + Squash merge](docs/adr/0001-github-flow.md)
- 0002 서버리스(S3 + CloudFront + Lambda) 선택 — 작성 예정
- 0003 CloudFront 단일 출처 + 쿠키 인증 — 작성 예정
- [0004 GitHub Actions OIDC 배포와 최소 권한 배포 역할](docs/adr/0004-github-actions-oidc.md)
- 0005 비용 제한 원칙 — 작성 예정
- [0006 인프라 변경은 사람이 적용하고, CI는 웹 파일만 배포](docs/adr/0006-manual-infra-apply.md)
- [0007 도메인 등록은 관리 계정, DNS는 워크로드 계정](docs/adr/0007-domain-registrar-and-dns-split.md)
- [0008 비공개 영역 로그인은 Google OIDC, 허용 계정 1개만 통과](docs/adr/0008-google-login-session.md)

## 보안

- **멀티 계정**: 결제 · 사용자 관리용 관리 계정과 사이트 리소스용 워크로드 계정을 분리했습니다.
- **SSO + MFA**: 사람은 IAM Identity Center로만 접근합니다. IAM 사용자와 장기 액세스 키는 0개입니다.
- **루트 사용자**: MFA를 등록하고 일상 작업에는 쓰지 않습니다.
- **배포**: 인프라 변경은 PR에서 plan을 확인한 뒤 SSO로 직접 적용하고, GitHub Actions는 웹 파일만 배포합니다. 배포 역할은 OIDC 임시 자격 증명으로 `main` 브랜치의 `production` 환경에서만 맡을 수 있고, 사이트 버킷 파일 쓰기와 CloudFront 캐시 무효화 외에는 권한이 없습니다.
- **비공개 영역**: Google OIDC 로그인에서 state · PKCE · nonce를 검증하고 ID 토큰 서명을 확인합니다. 세션은 httpOnly · Secure · SameSite=Strict 쿠키로, 브라우저를 끄면 끝나고 활동이 있어도 12시간이 지나면 다시 로그인합니다. API 응답은 캐시하지 않고, API Gateway에 요청 수 제한을 둡니다. Lambda 실행 역할은 권한 상한선 안에서 공고 테이블 읽기 · 지원 상태 변경과 비밀값 읽기만 합니다. 상태를 바꾸는 요청은 세션과 함께 `Origin`이 사이트 주소인지도 확인합니다.
- **계정 안전장치**: 계정 전체 S3 퍼블릭 차단과 IAM Access Analyzer(외부 공유 감지)를 켰습니다.
- **의존성**: GitHub Action은 커밋 SHA로 고정하고, Dependabot이 주 1회 업데이트 PR을 만듭니다(메이저 업데이트는 분리). 취약점이 공개된 의존성은 바로 PR로 받습니다.

자세한 기준은 [AWS 계정 보안 기준](docs/aws-account-setup.md)에 있습니다.

## 비용 관리

- 상시 실행 리소스 없이 사용한 만큼만 과금되는 서비스로 비용을 최소화하고, AWS Budgets로 월 $5 예산과 50% · 100% 알림을 설정합니다.
- 고정 비용은 도메인 등록(연 $16)과 Route 53 호스팅 영역(월 $0.50)뿐입니다. ACM 공인 인증서와 CloudFront 별칭 레코드 조회는 무료입니다.
- 상세 비용 표는 1차 배포 후 추가합니다.
