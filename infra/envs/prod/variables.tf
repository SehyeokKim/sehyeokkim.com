variable "account_id" {
  description = "워크로드 계정 ID. allowed_account_ids 가드에 쓴다 (terraform.tfvars에만 기록)"
  type        = string

  validation {
    condition     = can(regex("^[0-9]{12}$", var.account_id))
    error_message = "account_id는 12자리 숫자여야 합니다."
  }
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
