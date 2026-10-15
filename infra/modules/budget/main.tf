# 월 비용 예산과 이메일 알림.
# Budgets는 알림만 보내고 과금을 막지는 않는다. 비용이 큰 서비스는 배포 역할 권한에서 막는다.
resource "aws_budgets_budget" "this" {
  name         = var.name
  budget_type  = "COST"
  limit_amount = tostring(var.limit_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  # 실제 지출이 한도의 N%를 넘으면 알림
  dynamic "notification" {
    for_each = var.actual_thresholds

    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.alert_emails
    }
  }

  # 이번 달 예상 지출이 한도를 넘을 것으로 보이면 미리 알림
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
  }
}
