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
- 0004 GitHub Actions OIDC 배포 — 작성 예정
- 0005 비용 제한 원칙 — 작성 예정

## 비용 관리

- 무료 한도 안의 서비스만 사용하고, AWS Budgets로 월 $5 예산과 50% · 100% 알림을 설정합니다.
- 상세 비용 표는 1차 배포 후 추가합니다.
