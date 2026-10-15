variable "name" {
  description = "S3 버킷 이름이자 리소스 이름 접두어 (배포 역할 권한과 맞추려면 <project>-site-* 형식)"
  type        = string
}

variable "price_class" {
  description = "CloudFront 가격 등급. PriceClass_200은 한국 · 일본 엣지를 포함한다 (100은 북미 · 유럽만)"
  type        = string
  default     = "PriceClass_200"
}
