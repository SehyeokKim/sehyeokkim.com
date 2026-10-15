terraform {
  # use_lockfile(S3 네이티브 state 잠금)은 1.10부터 지원
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}
