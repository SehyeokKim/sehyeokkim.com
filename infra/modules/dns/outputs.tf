output "name_servers" {
  description = "관리 계정의 도메인 등록 설정에 넣을 네임서버 4개"
  value       = var.enable_dns ? aws_route53_zone.this[0].name_servers : []
}

output "certificate_arn" {
  description = "검증이 끝난 인증서 ARN. 도메인을 연결하지 않으면 null"
  value       = local.attach ? aws_acm_certificate_validation.this[0].certificate_arn : null
}

output "aliases" {
  description = "CloudFront 대체 도메인 이름. 도메인을 연결하지 않으면 빈 목록"
  value       = local.attach ? local.names : []
}
