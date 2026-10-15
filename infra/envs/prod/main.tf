module "site" {
  source = "../../modules/site"

  name = "${var.project}-site-prod"
}
