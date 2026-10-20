output "site_url" {
  description = "사이트 주소"
  value       = var.attach_domain ? "https://${var.domain_name}" : "https://${module.site.distribution_domain_name}"
}

output "cloudfront_url" {
  description = "CloudFront 기본 주소 (도메인 연결 후에도 접속 가능)"
  value       = "https://${module.site.distribution_domain_name}"
}

output "name_servers" {
  description = "관리 계정의 등록된 도메인 → 네임서버에 넣을 값"
  value       = module.dns.name_servers
}

output "site_bucket" {
  description = "정적 파일 S3 버킷 (배포 워크플로 변수 SITE_BUCKET)"
  value       = module.site.bucket_name
}

output "distribution_id" {
  description = "CloudFront 배포 ID (배포 워크플로 변수 CLOUDFRONT_DISTRIBUTION_ID)"
  value       = module.site.distribution_id
}

output "jobs_table" {
  description = "공고 테이블 (적재 스크립트 --table)"
  value       = module.api.table_name
}

output "api_function" {
  description = "API Lambda 함수 이름 (CloudWatch 로그 확인용)"
  value       = module.api.function_name
}

output "ssm_parameters" {
  description = "직접 만들어야 하는 SSM 파라미터 이름"
  value       = module.api.ssm_parameters
}
