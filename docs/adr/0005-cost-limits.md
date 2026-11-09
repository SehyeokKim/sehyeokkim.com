# 0005. 비용 제한 원칙

- 상태: 채택
- 날짜: 2026-10-15

## 배경

- 개인 프로젝트라 월 예산을 작게 정해 두고 운영합니다.
- 켜 둔 시간만큼 과금되는 리소스는 사이트에 요청이 없는 동안에도 요금이 쌓이고, 지울 때까지 계속 과금됩니다.
- AWS Budgets는 알림만 보내고 과금을 막지는 않습니다. 비용을 지키려면 비싼 리소스를 애초에 만들지 않는 규칙이 필요합니다.

## 결정

**요청 · 저장량만큼만 과금되는 서비스만 쓰고, 켜 두기만 해도 과금되는 리소스는 만들지 않습니다. 월 예산은 5달러로 두고 AWS Budgets 알림으로 지출을 확인합니다.**

사용하는 서비스와 이 프로젝트의 설정입니다.

| 서비스 | 쓰는 곳 · 설정 |
|---|---|
| S3 | 정적 사이트 버킷, Terraform state 버킷 |
| CloudFront | 배포 1개. 가격 등급은 한국 · 일본 엣지를 포함하는 `PriceClass_200` |
| Lambda | API 함수 1개. arm64, 메모리 256MB, 제한 시간 10초. 프로비저닝된 동시성 없음 |
| API Gateway HTTP API | 요청 제한 초당 10, 순간 20 |
| DynamoDB | 공고 테이블 1개, 온디맨드(`PAY_PER_REQUEST`). 마감 지난 공고는 `expires_at` TTL로 자동 삭제 |
| SSM Parameter Store | 표준 파라미터(SecureString)에 비밀값 보관 |
| CloudWatch | 기본 지표와 Lambda 로그. 로그 보관 기간 14일 |
| ACM | CloudFront용 공인 인증서(`us-east-1`) |

만들지 않는 리소스입니다. 모두 요청이 없어도 시간이나 개수 단위로 요금이 붙습니다.

| 리소스 | 대신 쓰는 것 |
|---|---|
| 추가 도메인 · 호스팅 영역 | `sehyeokkim.com`과 워크로드 계정 호스팅 영역 1개만 사용([ADR 0007](0007-domain-registrar-and-dns-split.md)) |
| Secrets Manager | SSM Parameter Store SecureString |
| 단독 WAF web ACL | API Gateway 요청 제한 |
| NAT Gateway, ALB, ECS, RDS | Lambda · API Gateway · DynamoDB 온디맨드([ADR 0002](0002-serverless-static-site.md)) |

고정 비용은 도메인 등록(연 16달러)과 호스팅 영역 1개(월 0.50달러)뿐입니다.

예산과 알림은 `infra/bootstrap/budget.tf`에서 `infra/modules/budget`으로 만듭니다.

| 알림 | 조건 |
|---|---|
| 실제 지출 | 월 5달러의 50%, 100%를 넘을 때 |
| 예상 지출 | 이번 달 예상 지출이 100%를 넘을 것으로 보일 때 |

비용이 생길 수 있는 변경은 적용 전에 예상 비용을 먼저 적습니다. 인프라 PR 템플릿에 "예상 비용" 항목이 있고, 사람이 plan을 확인한 뒤에만 apply합니다([ADR 0006](0006-manual-infra-apply.md)).

## 대안

| 대안 | 채택하지 않은 이유 |
|---|---|
| 비밀값을 Secrets Manager에 저장 | 자동 교체 기능이 있지만 비밀마다 월 요금이 붙습니다. 이 프로젝트의 비밀값(Google client secret, JWT 서명 키, 허용 계정 ID)은 사람이 직접 입력 · 교체하므로 자동 교체가 필요 없고, SSM SecureString도 KMS로 암호화됩니다. |
| WAF web ACL로 API 보호 | 관리형 규칙으로 봇 · 공격 요청을 거를 수 있지만 web ACL과 규칙마다 월 요금이 붙습니다. 비공개 데이터는 로그인한 세션에서만 나오고, 요청 수는 API Gateway 요청 제한으로 묶습니다. |
| 서비스를 제한하지 않고 Budgets 알림만으로 관리 | Budgets는 지출이 생긴 뒤에 알림을 보낼 뿐이라, 상시 과금 리소스가 만들어지면 지울 때까지 요금이 계속 쌓입니다. |

## 결과

- 월 고정 비용은 도메인과 호스팅 영역뿐이고, 나머지는 요청 · 저장량에 따라 달라집니다.
- CI의 배포 역할은 사이트 버킷 파일 쓰기와 CloudFront 캐시 무효화만 할 수 있어, 자동 배포로는 비용이 생기는 리소스를 만들 수 없습니다([ADR 0004](0004-github-actions-oidc.md), [ADR 0006](0006-manual-infra-apply.md)).
- 남는 위험: 요청 기반 과금이라 트래픽이 몰리면 비용이 늘어납니다. CloudFront 앞단에는 WAF가 없고, API는 요청 제한으로만 묶습니다. Budgets 알림으로 감지합니다.
- 위 표에 없는 서비스가 필요해지면, 예상 비용을 먼저 적고 상시 과금 여부를 확인한 뒤 추가합니다.
