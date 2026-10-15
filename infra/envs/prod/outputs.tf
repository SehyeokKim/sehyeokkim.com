output "site_url" {
  description = "사이트 주소"
  value       = "https://${module.site.distribution_domain_name}"
}

output "site_bucket" {
  description = "정적 파일 S3 버킷 (배포 워크플로 변수 SITE_BUCKET)"
  value       = module.site.bucket_name
}

output "distribution_id" {
  description = "CloudFront 배포 ID (배포 워크플로 변수 CLOUDFRONT_DISTRIBUTION_ID)"
  value       = module.site.distribution_id
}
