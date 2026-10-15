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

variable "github_repository" {
  description = "배포 역할을 맡을 수 있는 GitHub 저장소 (소유자/이름)"
  type        = string
  default     = "SehyeokKim/sehyeokkim.com"
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
