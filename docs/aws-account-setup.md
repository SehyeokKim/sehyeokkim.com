# AWS 계정 보안 기준

이 문서는 콘솔에서 직접 설정해서 Terraform 코드에 남지 않는 계정 수준 설정을 기록합니다.
Terraform으로 관리하는 리소스는 [`infra/`](../infra)에 있습니다.

## 계정 구조

AWS Organizations로 계정 2개를 나눠 씁니다.

| 계정 | 역할 | 리소스 | 접근 방법 |
|---|---|---|---|
| 관리 계정 | Organizations, IAM Identity Center, 통합 결제 | 없음 | 루트 사용자(MFA). 결제·계정 설정 작업에만 사용 |
| 워크로드 계정 | 이 사이트의 모든 AWS 리소스 | S3, CloudFront, Lambda 등 | IAM Identity Center(SSO)로만 접근 |

**왜 나눴나**

- **피해 범위 분리**: 워크로드 계정의 자격 증명이 유출되더라도 결제 설정이나 사용자 관리에는 손댈 수 없습니다.
- **역할 분리**: 결제 · 사용자 관리와 서비스 운영을 서로 다른 계정에서 합니다.
- **확장**: 나중에 개발용 계정이 필요하면 같은 조직 아래에 추가하고 같은 SSO 로그인으로 접근합니다.

## 루트 사용자

| 계정 | 설정 |
|---|---|
| 관리 계정 | MFA 등록, 액세스 키 없음, 일상 작업에 사용하지 않음 |
| 워크로드 계정 | Organizations에서 생성해 루트 비밀번호를 설정하지 않음, 액세스 키 없음 |

루트 사용자는 권한을 제한할 수 없는 계정이라 사용 자체를 최소화합니다.

## 사람의 접근: IAM Identity Center

- **IAM 사용자 0명, 장기 액세스 키 0개.** 콘솔과 CLI 모두 SSO 로그인으로 임시 자격 증명을 받습니다.
- **MFA**: 로그인할 때마다 요구합니다.
- **권한 세트**: `AdministratorAccess`, 세션 8시간. 사용자 1명이 워크로드 계정에만 할당되어 있습니다.
- **CLI**: `aws configure sso`로 만든 전용 프로필을 씁니다. 만료되면 `aws sso login`으로 다시 받습니다.

**왜 IAM 사용자를 만들지 않았나**

IAM 사용자의 액세스 키는 직접 삭제하기 전까지 유효합니다. 노트북이나 설정 파일에서 유출되면 그대로 악용될 수 있습니다.
SSO 임시 자격 증명은 정해진 시간이 지나면 자동으로 만료되고, 로그인할 때마다 MFA를 거칩니다.

## 기계의 접근: GitHub Actions

자동 배포는 사람의 SSO 역할이 아니라 배포 전용 역할 `sehyeokkim-github-deploy`를 씁니다. 이 역할은 [`infra/bootstrap`](../infra/bootstrap)에서 Terraform으로 관리합니다.

| | 사람 | GitHub Actions |
|---|---|---|
| 역할 | `AWSReservedSSO_AdministratorAccess_…` (권한 세트를 할당하면 자동 생성) | `sehyeokkim-github-deploy` (Terraform으로 생성) |
| 용도 | 콘솔 작업, 모든 Terraform 적용(`infra/bootstrap`, `infra/envs/prod`), 비밀값 · 계정 설정 | `main` 병합 시 웹 파일 자동 배포 |
| 인증 | 비밀번호 + MFA → SSO 임시 자격 증명 | GitHub OIDC 토큰 → 임시 자격 증명 (최대 1시간) |
| 맡을 수 있는 조건 | Identity Center에서 할당된 사용자 | 이 저장소의 `production` Environment 작업 (`main` 브랜치만 배포 허용) |
| 권한 | 관리자 | 사이트 버킷 파일 쓰기와 CloudFront 캐시 무효화만 |

**왜 역할을 나눴나**

- **MFA를 자동화할 수 없음**: SSO 역할은 사람이 브라우저에서 MFA를 거쳐야 쓸 수 있어, 워크플로에서는 쓸 수 없습니다.
- **장기 키를 두지 않음**: 사람 역할을 CI에서 쓰려면 액세스 키를 GitHub에 저장해야 합니다. OIDC는 실행할 때마다 짧은 임시 자격 증명만 받습니다.
- **피해 범위 축소**: 워크플로 안에서는 npm 패키지, 서드파티 Action 같은 외부 코드도 함께 실행됩니다. 그래서 관리자 권한 대신 배포에 필요한 권한만 줍니다.
- **자기 권한 수정 방지**: 배포 역할과 그 권한은 사람이 SSO로 bootstrap을 적용할 때만 바뀝니다. 배포 역할은 자기 권한을 고칠 수 없습니다.

세부 권한 설계는 [ADR 0004](adr/0004-github-actions-oidc.md)에 있습니다.

## 비용 알림

- **프리 티어 사용량 알림**, **CloudWatch 결제 알림**: 관리 계정에서 켬
- **결제 정보 IAM 액세스 활성화**: 루트 대신 SSO 로그인으로 비용 화면을 볼 수 있게 함
- 월 예산 알림(AWS Budgets)은 Terraform으로 관리합니다.

## 점검 방법

워크로드 계정에서 루트 액세스 키와 IAM 사용자가 없는지 확인합니다.

```bash
aws iam get-account-summary --profile <SSO 프로필> \
  --query 'SummaryMap.{RootAccessKeys:AccountAccessKeysPresent,IamUsers:Users}'
# 기대값: { "RootAccessKeys": 0, "IamUsers": 0 }
```
