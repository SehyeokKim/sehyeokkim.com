variable "name" {
  description = "S3 버킷 이름이자 리소스 이름 접두어 (배포 역할 권한과 맞추려면 <project>-site-* 형식)"
  type        = string
}

variable "price_class" {
  description = "CloudFront 가격 등급. PriceClass_200은 한국 · 일본 엣지를 포함한다 (100은 북미 · 유럽만)"
  type        = string
  default     = "PriceClass_200"
}

variable "aliases" {
  description = "CloudFront 대체 도메인 이름 (예: sehyeokkim.com, www.sehyeokkim.com). 비우면 cloudfront.net 주소만 쓴다"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "aliases를 덮는 us-east-1 ACM 인증서 ARN. null이면 CloudFront 기본 인증서"
  type        = string
  default     = null
}

variable "api_domain_name" {
  description = "API Gateway 호스트 이름. 주면 /api/* 경로를 그쪽으로 보낸다 (캐시 없음, 쿠키 · 쿼리 전달)"
  type        = string
  default     = null
}
