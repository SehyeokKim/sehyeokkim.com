# 0006. 인프라 변경은 사람이 적용하고, CI는 웹 파일만 배포

- 상태: 채택
- 날짜: 2026-10-15

## 배경

- [ADR 0004](0004-github-actions-oidc.md)에서는 `main`에 병합되면 GitHub Actions가 `terraform apply`와 파일 업로드를 모두 하는 구조를 전제로, 배포 역할에 CloudFront · Lambda · API Gateway · DynamoDB · IAM(앱 역할) 권한을 주고 위험한 작업은 명시적으로 거부했습니다.
- 그래도 남는 위험이 있었습니다. 배포 역할이 탈취되면 인프라 설정을 바꾸거나, Lambda 코드를 통해 비밀값에 간접적으로 접근할 수 있습니다.
- 이 사이트에서 자주 바뀌는 것은 웹 파일이고, 인프라는 드물게 바뀝니다. 인프라 변경은 대부분 비용 · 보안에 영향이 있어 사람이 plan을 보고 판단해야 합니다.

## 결정

**인프라 변경은 사람이 로컬 SSO로 적용하고, CI는 웹 빌드 결과만 배포합니다.**

| 변경 | 누가 · 어떻게 |
|---|---|
| Terraform (`infra/envs/prod`, `infra/bootstrap`) | PR에서 plan을 확인 → 사람이 로컬 SSO(`AdministratorAccess`)로 apply → 결과를 PR에 기록 → 병합 |
| 웹 파일 (`web/`) | `main` 병합 시 `deploy.yml`이 빌드 → S3 동기화 → CloudFront 캐시 무효화 |

배포 역할의 권한은 다음으로 줄입니다.

| 허용 | 대상 |
|---|---|
| `s3:ListBucket` | `sehyeokkim-site-*` 버킷 |
| `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject` | `sehyeokkim-site-*` 버킷의 객체 |
| `cloudfront:CreateInvalidation`, `cloudfront:GetInvalidation` | 이 계정의 CloudFront 배포 |

Terraform state, IAM, Lambda, API Gateway, DynamoDB, CloudWatch Logs 권한은 없습니다. 이후 API가 생기면 Lambda 코드 교체(`lambda:UpdateFunctionCode`)만 해당 함수로 한정해 추가합니다.

## 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| CI가 `terraform apply`까지 수행 (ADR 0004 원안) | 병합하면 인프라까지 자동으로 바뀌는 장점이 있지만, 배포 역할에 인프라 관리 권한이 필요하고 비용 · 보안 영향이 있는 변경이 사람 확인 없이 적용됩니다. |
| CI가 PR에서 `terraform plan`만 실행 | plan에도 state 읽기와 리소스 조회 권한이 필요합니다. PR 작업은 배포 역할을 맡을 수 없게 했기 때문에 별도 읽기 전용 역할이 필요해, 1인 프로젝트에는 관리 부담이 큽니다. |

## 결과

- 배포 역할이 탈취돼도 할 수 있는 일은 사이트 파일 변경과 캐시 무효화뿐입니다. 인프라 설정 변경, 비밀값 접근, 데이터 조회, 비용이 생기는 리소스 생성은 모두 불가능합니다.
- 인프라 PR은 병합 전에 사람이 apply하므로, PR 본문에 plan 요약 · 적용 결과 · 적용 후 `No changes` 확인을 남깁니다.
- 병합 시점과 적용 시점이 어긋날 수 있습니다. 실제로 #4는 병합 뒤에 push된 커밋이 빠져 코드와 인프라가 어긋났고, #5로 바로잡았습니다. 인프라 PR은 병합 직전에 브랜치 최신 커밋 기준으로 plan이 `No changes`인지 다시 확인합니다.
- ADR 0004의 OIDC · `production` Environment 신뢰 조건 · 권한 상한선 · 계정 안전장치는 그대로 유지합니다.
