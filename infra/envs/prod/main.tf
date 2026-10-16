module "site" {
  source = "../../modules/site"

  name                = "${var.project}-site-prod"
  aliases             = module.dns.aliases
  acm_certificate_arn = module.dns.certificate_arn
}

# 도메인 등록은 관리 계정, DNS(호스팅 영역 · 인증서 · 레코드)는 이 계정 (ADR 0007)
module "dns" {
  source = "../../modules/dns"
  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  domain_name               = var.domain_name
  enable_dns                = var.enable_dns
  attach_domain             = var.attach_domain
  cloudfront_domain_name    = module.site.distribution_domain_name
  cloudfront_hosted_zone_id = module.site.distribution_hosted_zone_id
}
