# GitHub Actions가 장기 액세스 키 없이 AWS에 배포하기 위한 구성.
#
# 1. OIDC 공급자: GitHub이 발급한 토큰을 AWS가 신뢰하도록 등록한다.
# 2. 배포 역할: production Environment(main 브랜치만 배포 허용)의 작업만 맡을 수 있다.
#    인프라 변경은 사람이 로컬 SSO로 적용하므로(ADR 0006), 배포 역할은 웹 파일 업로드와 캐시 무효화만 한다.
# 3. 권한 상한선(permissions boundary): 앱 역할(Lambda 실행 역할 등)이 넘을 수 없는 최대 권한.
#    앱 역할을 만들 때 항상 붙여, 실수로 넓은 정책을 붙여도 상한선을 넘지 못하게 한다.
#
# 이름 규칙
# - 사이트 버킷:        ${project}-site-*  ← 배포 역할이 파일을 쓸 수 있는 유일한 버킷
# - 앱 IAM 역할:        ${project}-app-*   ← 상한선 정책을 붙인다
# - 배포 역할 · 상한선: ${project}-github-deploy, ${project}-app-boundary

locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.region

  app_role_arn = "arn:aws:iam::${local.account_id}:role/${var.project}-app-*"
  boundary_arn = "arn:aws:iam::${local.account_id}:policy/${var.project}-app-boundary"
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

    # 이 저장소의 production Environment를 쓰는 작업만 허용.
    # 브랜치(ref:refs/heads/main) 조건만 두면 pull_request_target · workflow_run처럼
    # PR 코드를 main 컨텍스트로 실행하는 트리거도 통과한다. Environment는 GitHub 설정에서 main 브랜치로만 배포를 허용한다.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repository}:environment:${var.github_environment}"]
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
# 웹 빌드 결과를 사이트 버킷에 동기화(aws s3 sync --delete)하고 CloudFront 캐시를 비우는 데 필요한 권한만 준다.
# Terraform state, IAM, Lambda 등 다른 서비스 권한은 없다. 명시하지 않은 작업은 모두 거부된다.

data "aws_iam_policy_document" "github_deploy" {
  statement {
    sid       = "SiteBucketList"
    actions   = ["s3:ListBucket"]
    resources = ["arn:aws:s3:::${var.project}-site-*"]
  }

  statement {
    sid       = "SiteBucketObjects"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:aws:s3:::${var.project}-site-*/*"]
  }

  # 계정에 CloudFront 배포는 이 사이트 하나뿐이다. 배포 ID는 prod 스택에서 정해져 bootstrap에서는 알 수 없어 배포 단위(*)로 둔다.
  statement {
    sid       = "CloudFrontInvalidation"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = ["arn:aws:cloudfront::${local.account_id}:distribution/*"]
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
# 모든 앱 역할에 붙인다. 앱 역할의 실제 권한은 (역할 정책 ∩ 이 상한선)이다.

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
