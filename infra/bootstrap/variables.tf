variable "account_id" {
  description = "워크로드 계정 ID. allowed_account_ids 가드에 쓴다 (terraform.tfvars에만 기록)"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "account_id는 12자리 숫자여야 합니다."
  }
}

variable "alert_email" {
  description = "예산 알림을 받을 이메일 (terraform.tfvars에만 기록)"
  type        = string
  sensitive   = true
}

variable "aws_profile" {
  description = "로컬 실행 시 사용할 AWS CLI 프로필 (SSO)"
  type        = string
  default     = "sehyeokkim"
}

variable "region" {
  description = "기본 리전"
  type        = string
  default     = "ap-northeast-2"
}

variable "project" {
  description = "리소스 이름 접두어와 태그에 쓰는 프로젝트 이름"
  type        = string
  default     = "sehyeokkim"
}

variable "monthly_budget_usd" {
  description = "월 예산 한도 (USD)"
  type        = number
  default     = 5
}

variable "github_environment" {
  description = "배포 역할을 맡을 수 있는 GitHub Environment 이름 (Environment 설정에서 main 브랜치만 배포 허용)"
  type        = string
  default     = "production"
}

variable "github_oidc_subject_prefix" {
  description = <<-EOT
    GitHub OIDC 토큰 sub 클레임의 저장소 부분. 이 저장소는 불변 subject 형식
    (repo:<소유자>@<소유자 ID>/<저장소>@<저장소 ID>)을 쓴다. 이름이 바뀌거나 같은 이름의 저장소가
    다시 만들어져도 다른 저장소가 역할을 맡을 수 없다. 두 ID는 GitHub API로 조회되는 공개 값이다.
    확인: gh api repos/<소유자>/<저장소>/actions/oidc/customization/sub
  EOT
  type        = string
  default     = "repo:SehyeokKim@211638747/sehyeokkim.com@1418686194"
}
