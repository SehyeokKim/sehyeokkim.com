# GitHub Actions가 장기 액세스 키 없이 AWS에 배포하기 위한 구성.
#
# 1. OIDC 공급자: GitHub이 발급한 토큰을 AWS가 신뢰하도록 등록한다.
# 2. 배포 역할: main 브랜치 워크플로만 맡을 수 있고, 이 프로젝트가 쓰는 서비스 · 리소스로 권한을 한정한다.
# 3. 권한 상한선(permissions boundary): 배포 역할이 만드는 앱 역할(Lambda 실행 역할 등)이
#    넘을 수 없는 최대 권한. 배포 역할이 Admin 역할을 만들어 권한을 키우는 것을 막는다.
#
# 이름 규칙
# - 사이트 리소스:      ${project}-site-*, ${project}-api-*, ${project}-jobs* 등 ${project}-* (단, 아래 예외 제외)
# - 앱 IAM 역할:        ${project}-app-*   ← 배포 역할이 만들고 고칠 수 있는 유일한 IAM 역할
# - 배포 역할 · 상한선: ${project}-github-deploy, ${project}-app-boundary ← 배포 역할이 수정 불가

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.region

  state_bucket_arn = aws_s3_bucket.tfstate.arn
  app_role_arn     = "arn:aws:iam::${local.account_id}:role/${var.project}-app-*"
  boundary_arn     = "arn:aws:iam::${local.account_id}:policy/${var.project}-app-boundary"
}

resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
}

# ── 배포 역할: 신뢰 정책 ──────────────────────────────────────────────

data "aws_iam_policy_document" "github_trust" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # 이 저장소의 main 브랜치에서 실행된 워크플로만 허용 (PR · 포크 · 다른 브랜치 불가)
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name = "${var.project}-github-deploy"
  # IAM 역할 description은 ASCII · Latin-1만 허용한다 (한글 불가)
  description          = "GitHub Actions deploy role (main branch only)"
  assume_role_policy   = data.aws_iam_policy_document.github_trust.json
  max_session_duration = 3600
}

# ── 배포 역할: 권한 정책 ──────────────────────────────────────────────

data "aws_iam_policy_document" "github_deploy" {
  # Terraform state: prod 경로의 객체 읽기 · 쓰기와 잠금 파일만. 버킷 자체는 건드릴 수 없다.
  statement {
    sid       = "StateList"
    actions   = ["s3:ListBucket"]
    resources = [local.state_bucket_arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["prod/*"]
    }
  }

  statement {
    sid       = "StateObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${local.state_bucket_arn}/prod/*"]
  }

  # 정적 사이트 버킷
  statement {
    sid     = "SiteBucket"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${var.project}-site-*",
      "arn:aws:s3:::${var.project}-site-*/*",
    ]
  }

  # CloudFront는 배포 생성 · 정책 · OAC 등 대부분의 작업이 리소스 단위 제한을 지원하지 않는다
  statement {
    sid       = "CloudFront"
    actions   = ["cloudfront:*"]
    resources = ["*"]
  }

  statement {
    sid       = "Lambda"
    actions   = ["lambda:*"]
    resources = ["arn:aws:lambda:${local.region}:${local.account_id}:function:${var.project}-*"]
  }

  # HTTP API (API Gateway v2). ARN에 계정 ID가 없어 리전으로 한정한다.
  statement {
    sid       = "ApiGateway"
    actions   = ["apigateway:*"]
    resources = ["arn:aws:apigateway:${local.region}::/*"]
  }

  statement {
    sid     = "DynamoDB"
    actions = ["dynamodb:*"]
    resources = [
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${var.project}-*",
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${var.project}-*/*",
    ]
  }

  statement {
    sid     = "Logs"
    actions = ["logs:*"]
    resources = [
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${var.project}-*",
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${var.project}-*:*",
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/apigateway/${var.project}-*",
      "arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/apigateway/${var.project}-*:*",
    ]
  }

  # 로그 그룹 조회와 API Gateway 액세스 로그 전송 설정은 리소스 단위 제한을 지원하지 않는다
  statement {
    sid = "LogsAccountLevel"
    actions = [
      "logs:DescribeLogGroups",
      "logs:CreateLogDelivery",
      "logs:GetLogDelivery",
      "logs:UpdateLogDelivery",
      "logs:DeleteLogDelivery",
      "logs:ListLogDeliveries",
      "logs:PutResourcePolicy",
      "logs:DescribeResourcePolicies",
    ]
    resources = ["*"]
  }

  # 비밀값(SSM SecureString)은 콘솔/CLI로 직접 넣고, Terraform은 이름만 참조한다
  statement {
    sid       = "SsmRead"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["arn:aws:ssm:${local.region}:${local.account_id}:parameter/${var.project}/*"]
  }

  statement {
    sid       = "SsmDescribe"
    actions   = ["ssm:DescribeParameters"]
    resources = ["*"]
  }

  # 앱 역할 생성 · 수정: 반드시 권한 상한선이 붙어 있어야 한다
  statement {
    sid = "AppRolesWithBoundary"
    actions = [
      "iam:CreateRole",
      "iam:PutRolePermissionsBoundary",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
    ]
    resources = [local.app_role_arn]

    condition {
      test     = "StringEquals"
      variable = "iam:PermissionsBoundary"
      values   = [local.boundary_arn]
    }
  }

  statement {
    sid = "AppRolesManage"
    actions = [
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:UpdateRole",
      "iam:UpdateRoleDescription",
      "iam:UpdateAssumeRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:DeleteRole",
    ]
    resources = [local.app_role_arn]
  }

  # 앱 역할은 Lambda에만 넘겨줄 수 있다
  statement {
    sid       = "PassAppRoleToLambda"
    actions   = ["iam:PassRole"]
    resources = [local.app_role_arn]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["lambda.amazonaws.com"]
    }
  }

  # 상한선 정책은 조회만 가능 (수정 · 삭제 · 해제 불가)
  statement {
    sid       = "ReadBoundary"
    actions   = ["iam:GetPolicy", "iam:GetPolicyVersion"]
    resources = [local.boundary_arn]
  }
}

resource "aws_iam_policy" "github_deploy" {
  name        = "${var.project}-github-deploy"
  description = "GitHub Actions 배포 역할 권한 (프로젝트 서비스 · 리소스로 한정)"
  policy      = data.aws_iam_policy_document.github_deploy.json
}

resource "aws_iam_role_policy_attachment" "github_deploy" {
  role       = aws_iam_role.github_deploy.name
  policy_arn = aws_iam_policy.github_deploy.arn
}

# ── 앱 역할 권한 상한선 ───────────────────────────────────────────────
# 배포 역할이 만드는 모든 앱 역할에 붙는다. 앱 역할의 실제 권한은 (역할 정책 ∩ 이 상한선)이다.

data "aws_iam_policy_document" "app_boundary" {
  statement {
    sid = "LambdaLogs"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = ["arn:aws:logs:${local.region}:${local.account_id}:log-group:/aws/lambda/${var.project}-*:*"]
  }

  statement {
    sid = "DynamoDBData"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
    ]
    resources = [
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${var.project}-*",
      "arn:aws:dynamodb:${local.region}:${local.account_id}:table/${var.project}-*/index/*",
    ]
  }

  statement {
    sid       = "SsmRead"
    actions   = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = ["arn:aws:ssm:${local.region}:${local.account_id}:parameter/${var.project}/*"]
  }

  # SecureString 복호화: SSM을 거친 요청만 허용
  statement {
    sid       = "DecryptViaSsm"
    actions   = ["kms:Decrypt"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["ssm.${local.region}.amazonaws.com"]
    }
  }
}

resource "aws_iam_policy" "app_boundary" {
  name        = "${var.project}-app-boundary"
  description = "앱 역할(Lambda 실행 역할 등)의 최대 권한 상한선"
  policy      = data.aws_iam_policy_document.app_boundary.json
}
