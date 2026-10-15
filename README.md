# sehyeokkim.com

김세혁의 이력서·포트폴리오 사이트입니다. 사이트 자체를 AWS 위에 직접 설계·배포·운영하며, 이 저장소에 그 과정(IaC, CI/CD, 보안, 비용 관리)을 기록합니다.

> 🚧 작업 중입니다. 배포 주소는 1차 배포 후 추가합니다.

## 무엇이 있나

| 영역 | 설명 |
|---|---|
| 공개 이력서 | 누구나 볼 수 있는 이력서·프로젝트 소개 페이지 |
| 비공개 영역 (`/private`) | 로그인한 소유자만 보는 구직 정보 대시보드 (JWT 쿠키 인증, 검색 엔진 차단) |

## 아키텍처

```
                 ┌──────────────── CloudFront ────────────────┐
브라우저 ──HTTPS──▶│  /*      → S3 (정적 사이트, OAC 전용 접근)  │
                 │  /api/*  → API Gateway (HTTP API) → Lambda  │──▶ DynamoDB
                 └─────────────────────────────────────────────┘        SSM Parameter Store
```

- **단일 출처**: CloudFront 하나 아래에 정적 사이트와 API를 함께 두어 CORS 없이 httpOnly 쿠키 인증을 사용합니다.
- **서버리스**: 상시 과금 리소스 없이 S3 · CloudFront · Lambda · DynamoDB 온디맨드만 사용합니다.
- **인증**: 사용자 1명. 비밀번호 해시와 JWT 서명 키는 SSM Parameter Store(SecureString)에 보관합니다.

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 웹 | Next.js (정적 export), TypeScript |
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
docs/         아키텍처 문서와 ADR(설계 결정 기록)
.github/      CI(PR 검사) · 배포 워크플로
```

## 설계 결정 (ADR)

`docs/adr/`에 배경 · 결정 · 대안 · 결과를 기록합니다.

- [0001 브랜치 전략: GitHub Flow + Squash merge](docs/adr/0001-github-flow.md)
- 0002 서버리스(S3 + CloudFront + Lambda) 선택 — 작성 예정
- 0003 CloudFront 단일 출처 + 쿠키 인증 — 작성 예정
- [0004 GitHub Actions OIDC 배포와 최소 권한 배포 역할](docs/adr/0004-github-actions-oidc.md)
- 0005 비용 제한 원칙 — 작성 예정

## 보안

- **멀티 계정**: 결제 · 사용자 관리용 관리 계정과 사이트 리소스용 워크로드 계정을 분리했습니다.
- **SSO + MFA**: 사람은 IAM Identity Center로만 접근합니다. IAM 사용자와 장기 액세스 키는 0개입니다.
- **루트 사용자**: MFA를 등록하고 일상 작업에는 쓰지 않습니다.
- **배포**: GitHub Actions는 OIDC로 임시 자격 증명을 받는 배포 전용 역할을 씁니다. `main` 브랜치의 `production` 환경에서만 맡을 수 있고, 권한은 사이트에 필요한 서비스로 한정했습니다. 상시 과금 · 데이터 조회 · 외부 공유 작업은 명시적으로 거부합니다.
- **계정 안전장치**: 계정 전체 S3 퍼블릭 차단과 IAM Access Analyzer(외부 공유 감지)를 켰습니다.
- **의존성**: GitHub Action은 커밋 SHA로 고정하고, Dependabot이 주 1회 업데이트 PR을 만듭니다(메이저 업데이트는 분리). 취약점이 공개된 의존성은 바로 PR로 받습니다.

자세한 기준은 [AWS 계정 보안 기준](docs/aws-account-setup.md)에 있습니다.

## 비용 관리

- 무료 한도 안의 서비스만 사용하고, AWS Budgets로 월 $5 예산과 50% · 100% 알림을 설정합니다.
- 상세 비용 표는 1차 배포 후 추가합니다.
