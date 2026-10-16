variable "domain_name" {
  description = "루트 도메인 (예: sehyeokkim.com). 도메인 등록은 관리 계정에 있고, 이 모듈은 워크로드 계정의 DNS만 관리한다"
  type        = string
}

variable "enable_dns" {
  description = "호스팅 영역을 만든다 (월 $0.50). 비용 승인 전에는 false"
  type        = bool
  default     = false
}

variable "attach_domain" {
  description = "인증서 발급과 CloudFront 별칭 레코드를 만든다. 관리 계정에서 네임서버 위임을 마친 뒤 true (위임 전에는 인증서 DNS 검증이 끝나지 않는다)"
  type        = bool
  default     = false
}

variable "cloudfront_domain_name" {
  description = "별칭 레코드가 가리킬 CloudFront 배포 주소 (xxxx.cloudfront.net)"
  type        = string
}

variable "cloudfront_hosted_zone_id" {
  description = "CloudFront 배포의 Route 53 호스팅 영역 ID (별칭 레코드에 필요)"
  type        = string
}
