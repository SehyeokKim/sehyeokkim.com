from datetime import date

import pytest
from botocore.exceptions import ClientError

from app import auth
from app.jobs import DynamoJobRepository

SITE = "https://sehyeokkim.com"


def login(client, settings):
    client.cookies.set(auth.SESSION_COOKIE, auth.issue_session(settings))


def test_apply_marks_job_applied_with_channel_and_date(client, settings):
    login(client, settings)
    resp = client.patch(
        "/api/jobs/sample-002",
        json={"status": "applied", "applied_via": "recruit.example.net"},
        headers={"Origin": SITE},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "applied"
    assert body["applied_via"] == "recruit.example.net"
    assert body["applied_at"]  # 서버가 오늘 날짜(KST)로 기록

    listed = {j["id"]: j for j in client.get("/api/jobs").json()["items"]}
    assert listed["sample-002"]["status"] == "applied"


def test_apply_accepts_company_channel(client, settings):
    login(client, settings)
    resp = client.patch(
        "/api/jobs/sample-001", json={"status": "applied", "applied_via": "company"}, headers={"Origin": SITE}
    )
    assert resp.status_code == 200


def test_apply_requires_session(client):
    resp = client.patch(
        "/api/jobs/sample-002", json={"status": "applied", "applied_via": "company"}, headers={"Origin": SITE}
    )
    assert resp.status_code == 401


@pytest.mark.parametrize("origin", [None, "https://evil.example.com", "http://sehyeokkim.com"])
def test_apply_rejects_other_origins(client, settings, origin):
    login(client, settings)
    headers = {"Origin": origin} if origin else {}
    resp = client.patch("/api/jobs/sample-002", json={"status": "applied", "applied_via": "company"}, headers=headers)
    assert resp.status_code == 401


@pytest.mark.parametrize(
    "body",
    [
        {"status": "excluded", "applied_via": "company"},  # 지금은 지원 완료만
        {"status": "applied", "applied_via": "javascript:alert(1)"},
        {"status": "applied", "applied_via": "https://jobs.example.com/1"},  # 주소가 아니라 도메인만
        {"status": "applied"},
        {"status": "applied", "applied_via": "company", "memo": "다른 필드"},
    ],
)
def test_apply_rejects_invalid_body(client, settings, body):
    login(client, settings)
    resp = client.patch("/api/jobs/sample-002", json=body, headers={"Origin": SITE})
    assert resp.status_code == 422


def test_apply_unknown_job_is_404(client, settings):
    login(client, settings)
    resp = client.patch(
        "/api/jobs/no-such-job", json={"status": "applied", "applied_via": "company"}, headers={"Origin": SITE}
    )
    assert resp.status_code == 404


class FakeUpdateTable:
    def __init__(self, result=None, error_code=None):
        self.result = result
        self.error_code = error_code
        self.kwargs = None

    def update_item(self, **kwargs):
        self.kwargs = kwargs
        if self.error_code:
            raise ClientError({"Error": {"Code": self.error_code, "Message": ""}}, "UpdateItem")
        return {"Attributes": self.result}


def make_repo(table) -> DynamoJobRepository:
    repo = DynamoJobRepository.__new__(DynamoJobRepository)
    repo.table = table
    return repo


def test_dynamo_mark_applied_updates_only_status_fields(sample_jobs):
    item = sample_jobs[1].model_dump(mode="json") | {
        "status": "applied",
        "applied_at": "2026-10-20",
        "applied_via": "company",
        "expires_at": 1893456000,
    }
    table = FakeUpdateTable(result=item)
    job = make_repo(table).mark_applied("sample-002", "company", date(2026, 10, 20))

    assert job.status == "applied" and job.applied_via == "company"
    assert table.kwargs["ConditionExpression"] == "attribute_exists(id)"  # 없는 공고를 새로 만들지 않음
    assert table.kwargs["ExpressionAttributeValues"][":at"] == "2026-10-20"


def test_dynamo_mark_applied_returns_none_for_missing_job():
    table = FakeUpdateTable(error_code="ConditionalCheckFailedException")
    assert make_repo(table).mark_applied("missing", "company", date(2026, 10, 20)) is None


def test_dynamo_mark_applied_reraises_other_errors():
    table = FakeUpdateTable(error_code="ProvisionedThroughputExceededException")
    with pytest.raises(ClientError):
        make_repo(table).mark_applied("sample-002", "company", date(2026, 10, 20))
