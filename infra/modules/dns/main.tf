# 워크로드 계정의 DNS: 호스팅 영역 · ACM 인증서(us-east-1) · CloudFront 별칭 레코드.
# 도메인 등록(결제 · 갱신 · 네임서버 설정)은 관리 계정에 두고, 그 네임서버를 이 영역으로 위임한다.

locals {
  attach = var.enable_dns && var.attach_domain
  names  = [var.domain_name, "www.${var.domain_name}"]
}

resource "aws_route53_zone" "this" {
  count = var.enable_dns ? 1 : 0

  name    = var.domain_name
  comment = "Delegated from the management account registrar"

  # 영역을 지우면 네임서버가 바뀌어 도메인 전체가 끊긴다. 삭제는 사람이 이 설정을 풀고 따로 한다
  lifecycle {
    prevent_destroy = true
  }
}

# ACM 인증서 (CloudFront는 us-east-1 인증서만 쓸 수 있다)

resource "aws_acm_certificate" "this" {
  count    = local.attach ? 1 : 0
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  # 교체 시 새 인증서를 먼저 만들어 CloudFront가 인증서 없는 순간이 없게 한다
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "validation" {
  for_each = local.attach ? {
    for dvo in aws_acm_certificate.this[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  } : {}

  zone_id         = aws_route53_zone.this[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 300
  allow_overwrite = true
}

# 검증이 끝날 때까지 기다린다. 네임서버 위임이 안 됐으면 여기서 시간 초과로 실패한다
resource "aws_acm_certificate_validation" "this" {
  count    = local.attach ? 1 : 0
  provider = aws.us_east_1

  certificate_arn         = aws_acm_certificate.this[0].arn
  validation_record_fqdns = [for r in aws_route53_record.validation : r.fqdn]
}

# CloudFront 별칭 레코드 (루트 · www, IPv4 · IPv6)

resource "aws_route53_record" "alias" {
  for_each = local.attach ? {
    for pair in setproduct(local.names, ["A", "AAAA"]) : "${pair[0]}-${pair[1]}" => {
      name = pair[0]
      type = pair[1]
    }
  } : {}

  zone_id = aws_route53_zone.this[0].zone_id
  name    = each.value.name
  type    = each.value.type

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}
