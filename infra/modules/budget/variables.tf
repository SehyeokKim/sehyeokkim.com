variable "name" {
  description = "예산 이름"
  type        = string
}

variable "limit_usd" {
  description = "월 예산 한도 (USD)"
  type        = number
}

variable "alert_emails" {
  description = "알림을 받을 이메일 목록"
  type        = list(string)
  sensitive   = true
}

variable "actual_thresholds" {
  description = "실제 지출 알림 기준 (한도 대비 %)"
  type        = list(number)
  default     = [50, 100]
}
