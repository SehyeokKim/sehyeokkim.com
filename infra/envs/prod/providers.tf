provider "aws" {
  region  = var.region
  profile = var.aws_profile

  # 다른 계정(실습 계정 등)의 자격 증명으로 실행되면 plan 단계에서 바로 중단한다
  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Stack     = "prod"
    }
  }
}

# CloudFront용 ACM 인증서는 us-east-1에서만 발급할 수 있다
provider "aws" {
  alias   = "us_east_1"
  region  = "us-east-1"
  profile = var.aws_profile

  allowed_account_ids = [var.account_id]

  default_tags {
    tags = {
      Project   = var.project
      ManagedBy = "terraform"
      Stack     = "prod"
    }
  }
}
