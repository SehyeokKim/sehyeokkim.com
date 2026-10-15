# 계정 수준 보안 설정.

# 계정 전체 S3 퍼블릭 차단: 버킷마다 설정을 빠뜨리거나 버킷 정책이 바뀌어도 공개되지 않는다.
# 배포 역할에는 이 설정을 바꾸는 권한(s3:PutAccountPublicAccessBlock)이 없다.
# CloudFront OAC용 버킷 정책은 특정 배포만 허용하므로 "퍼블릭"에 해당하지 않아 영향이 없다.
resource "aws_s3_account_public_access_block" "this" {
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Access Analyzer (외부 접근 분석, 무료): 다른 계정이나 퍼블릭에 공유된 리소스를 찾아 콘솔에 표시한다.
resource "aws_accessanalyzer_analyzer" "external" {
  analyzer_name = "${var.project}-external-access"
  type          = "ACCOUNT"
}
