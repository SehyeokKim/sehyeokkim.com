# 비공개 영역 API: API Gateway HTTP API → Lambda(FastAPI) → DynamoDB · SSM.
# CloudFront /api/* 경로로만 쓰고, 로그인 · 세션 규칙은 ADR 0008.

locals {
  name       = "${var.project}-api"
  ssm_prefix = "/${var.project}"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# 공고 테이블

resource "aws_dynamodb_table" "jobs" {
  name         = "${var.project}-jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # 마감 지난 공고는 expires_at(유닉스 초)이 지나면 자동 삭제
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  # 실수로 테이블을 지우지 못하게 막는다. 삭제는 사람이 이 설정을 풀고 따로 한다
  deletion_protection_enabled = true
}

# Lambda 실행 역할 (bootstrap의 권한 상한선 정책을 반드시 붙인다)

data "aws_iam_policy" "app_boundary" {
  name = "${var.project}-app-boundary"
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name                 = "${var.project}-app-api"
  description          = "Lambda execution role for the private dashboard API"
  assume_role_policy   = data.aws_iam_policy_document.lambda_assume.json
  permissions_boundary = data.aws_iam_policy.app_boundary.arn
}

data "aws_iam_policy_document" "lambda" {
  statement {
    sid       = "Logs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.lambda.arn}:*"]
  }

  # 목록 조회와 지원 상태 변경(UpdateItem)만 한다. 공고 추가 · 삭제는 사람이 로컬 SSO로 적재 스크립트를 실행할 때만
  statement {
    sid       = "ReadJobs"
    actions   = ["dynamodb:Scan", "dynamodb:GetItem", "dynamodb:Query"]
    resources = [aws_dynamodb_table.jobs.arn]
  }

  statement {
    sid       = "UpdateJobStatus"
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.jobs.arn]
  }

  statement {
    sid     = "ReadSecrets"
    actions = ["ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/google/*",
      "arn:aws:ssm:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/auth/*",
    ]
  }

  statement {
    sid       = "DecryptViaSsm"
    actions   = ["kms:Decrypt"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${data.aws_region.current.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy" "lambda" {
  name   = "api"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda.json
}

# Lambda

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${local.name}"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "api" {
  function_name    = local.name
  role             = aws_iam_role.lambda.arn
  runtime          = "python3.12"
  architectures    = ["arm64"]
  handler          = "app.main.handler"
  filename         = var.lambda_zip_path
  source_code_hash = filebase64sha256(var.lambda_zip_path)
  memory_size      = 256
  timeout          = 10

  environment {
    variables = {
      SITE_URL   = var.site_url
      TABLE_NAME = aws_dynamodb_table.jobs.name
      SSM_PREFIX = local.ssm_prefix
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda, aws_iam_role_policy.lambda]
}

# API Gateway HTTP API

resource "aws_apigatewayv2_api" "this" {
  name          = local.name
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api" {
  api_id    = aws_apigatewayv2_api.this.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_rate_limit  = var.throttle_rate_limit
    throttling_burst_limit = var.throttle_burst_limit
  }
}

resource "aws_lambda_permission" "apigateway" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.this.execution_arn}/*/*"
}
