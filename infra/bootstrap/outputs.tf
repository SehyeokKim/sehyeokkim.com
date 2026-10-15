output "state_bucket" {
  description = "Terraform state 버킷 이름 (envs/prod 백엔드에서 사용)"
  value       = aws_s3_bucket.tfstate.bucket
}

# 계정 ID가 포함되어 있어 sensitive로 둔다. 확인: terraform output -raw github_deploy_role_arn
output "github_deploy_role_arn" {
  description = "GitHub Actions 배포 역할 ARN (저장소 시크릿 AWS_DEPLOY_ROLE_ARN에 등록)"
  value       = aws_iam_role.github_deploy.arn
  sensitive   = true
}

output "app_boundary_policy_arn" {
  description = "앱 역할에 붙일 권한 상한선 정책 ARN"
  value       = aws_iam_policy.app_boundary.arn
  sensitive   = true
}
