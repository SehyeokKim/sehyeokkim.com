output "bucket_name" {
  description = "정적 파일을 올릴 S3 버킷 이름"
  value       = aws_s3_bucket.site.bucket
}

output "distribution_id" {
  description = "CloudFront 배포 ID (배포 후 캐시 무효화에 사용)"
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_domain_name" {
  description = "사이트 주소 (도메인 연결 전 xxxx.cloudfront.net)"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront 배포의 Route 53 호스팅 영역 ID (별칭 레코드에 사용)"
  value       = aws_cloudfront_distribution.site.hosted_zone_id
}

output "distribution_arn" {
  description = "CloudFront 배포 ARN"
  value       = aws_cloudfront_distribution.site.arn
}
