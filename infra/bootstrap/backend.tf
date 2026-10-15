# bootstrap 자신의 state도 S3에 둔다.
# 처음에는 버킷이 없어 로컬 state로 apply한 뒤, 이 블록을 추가하고 `terraform init -migrate-state`로 옮겼다.
# key를 bootstrap/ 아래에 두어, 배포 역할(prod/* 만 접근 가능)이 이 state를 읽거나 고칠 수 없게 한다.
terraform {
  backend "s3" {
    bucket       = "sehyeokkim-tfstate"
    key          = "bootstrap/terraform.tfstate"
    region       = "ap-northeast-2"
    profile      = "sehyeokkim"
    encrypt      = true
    use_lockfile = true
  }
}
