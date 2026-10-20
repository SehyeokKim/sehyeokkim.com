output "api_domain_name" {
  description = "API Gateway 주소의 호스트 이름 (CloudFront 오리진으로 쓴다)"
  value       = replace(aws_apigatewayv2_api.this.api_endpoint, "https://", "")
}

output "table_name" {
  description = "공고 테이블 이름 (적재 스크립트 --table)"
  value       = aws_dynamodb_table.jobs.name
}

output "function_name" {
  description = "Lambda 함수 이름 (로그 확인용)"
  value       = aws_lambda_function.api.function_name
}

output "ssm_parameters" {
  description = "사용자가 직접 만들어야 하는 SSM 파라미터 이름"
  value = {
    google_client_id     = "${local.ssm_prefix}/google/client_id"
    google_client_secret = "${local.ssm_prefix}/google/client_secret"
    jwt_key              = "${local.ssm_prefix}/auth/jwt_key"
    allowed_sub          = "${local.ssm_prefix}/auth/allowed_sub"
  }
}
