# 운영 스택 state. 인프라 변경은 사람이 로컬 SSO로 plan · apply한다 (CI는 이 state에 쓰지 않는다).
terraform {
  backend "s3" {
    bucket       = "sehyeokkim-tfstate"
    key          = "prod/terraform.tfstate"
    region       = "ap-northeast-2"
    profile      = "sehyeokkim"
    encrypt      = true
    use_lockfile = true
  }
}
