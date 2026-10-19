variable "project" {
  description = "리소스 이름 접두어. 권한 상한선 정책이 <project>-* 이름만 허용한다"
  type        = string
}

variable "site_url" {
  description = "사이트 주소. Google 로그인 리디렉션 URI(<site_url>/api/auth/callback)를 만든다"
  type        = string
}

variable "lambda_zip_path" {
  description = "api/scripts/build_lambda.py가 만든 배포 패키지 경로"
  type        = string
}

variable "throttle_rate_limit" {
  description = "API Gateway 초당 요청 수 상한 (남용 · 비용 폭주 방지)"
  type        = number
  default     = 10
}

variable "throttle_burst_limit" {
  description = "API Gateway 순간 요청 수 상한"
  type        = number
  default     = 20
}

variable "log_retention_days" {
  description = "Lambda 로그 보관 기간"
  type        = number
  default     = 14
}
