module "budget" {
  source = "../modules/budget"

  name              = "${var.project}-monthly"
  limit_usd         = var.monthly_budget_usd
  alert_emails      = [var.alert_email]
  actual_thresholds = [50, 100]
}
