import pytest
from botocore.exceptions import ClientError

from app import auth
from app.jobs import DynamoJobRepository, JobConflict

SITE = "https://sehyeokkim.com"


def login(client, settings):
    client.cookies.set(auth.SESSION_COOKIE, auth.issue_session(settings))


def patch(client, job_id, body):
    return client.patch(f"/api/jobs/{job_id}", json=body, headers={"Origin": SITE})


def test_close_then_reopen_restores_previous_status(client, settings):
    login(client, settings)
    resp = patch(client, "sample-001", {"closed": True})
    assert resp.status_code == 200
    assert resp.json()["status"] == "closed"
    assert resp.json()["closed_from"] == "candidate"

    resp = patch(client, "sample-001", {"closed": False})
    assert resp.status_code == 200
    assert resp.json()["status"] == "candidate"
    assert resp.json()["closed_from"] is None


def test_close_applied_job_is_409(client, settings):
    login(client, settings)
    assert patch(client, "sample-004", {"closed": True}).status_code == 409


def test_reopen_job_that_is_not_closed_is_409(client, settings):
    login(client, settings)
    assert patch(client, "sample-003", {"closed": False}).status_code == 409


def test_close_unknown_job_is_404(client, settings):
    login(client, settings)
    assert patch(client, "no-such-job", {"closed": True}).status_code == 404


def test_close_requires_session(client):
    assert patch(client, "sample-001", {"closed": True}).status_code == 401


def test_close_rejects_other_origin(client, settings):
    login(client, settings)
    resp = client.patch("/api/jobs/sample-001", json={"closed": True}, headers={"Origin": "https://evil.example.com"})
    assert resp.status_code == 401


@pytest.mark.parametrize(
    "body",
    [
        {"closed": "yes"},  # 불리언만
        {"closed": 1},
        {"closed": True, "status": "closed"},
        {"closed": True, "memo": "다른 필드"},
        {},
    ],
)
def test_close_rejects_invalid_body(client, settings, body):
    login(client, settings)
    assert patch(client, "sample-001", body).status_code == 422


class FakeUpdateTable:
    def __init__(self, result=None, error_code=None, old_item=None):
        self.result = result
        self.error_code = error_code
        self.old_item = old_item
        self.kwargs = None

    def update_item(self, **kwargs):
        self.kwargs = kwargs
        if self.error_code:
            response = {"Error": {"Code": self.error_code, "Message": ""}}
            if self.old_item:
                response["Item"] = self.old_item
            raise ClientError(response, "UpdateItem")
        return {"Attributes": self.result}


def make_repo(table) -> DynamoJobRepository:
    repo = DynamoJobRepository.__new__(DynamoJobRepository)
    repo.table = table
    return repo


def test_dynamo_close_keeps_previous_status_and_skips_applied(sample_jobs):
    item = sample_jobs[0].model_dump(mode="json") | {"status": "closed", "closed_from": "candidate"}
    table = FakeUpdateTable(result=item)
    job = make_repo(table).set_closed("sample-001", True)

    assert job.status == "closed" and job.closed_from == "candidate"
    assert table.kwargs["UpdateExpression"] == "SET closed_from = #status, #status = :closed"
    # 지원 완료 · 이미 마감인 공고는 조건에서 빠진다
    assert "applied" not in table.kwargs["ExpressionAttributeValues"].values()
    assert table.kwargs["ConditionExpression"].startswith("attribute_exists(id)")


def test_dynamo_reopen_falls_back_to_new(sample_jobs):
    item = sample_jobs[2].model_dump(mode="json")
    table = FakeUpdateTable(result=item)
    make_repo(table).set_closed("sample-003", False)

    assert table.kwargs["UpdateExpression"] == "SET #status = if_not_exists(closed_from, :new) REMOVE closed_from"
    assert table.kwargs["ConditionExpression"] == "attribute_exists(id) AND #status = :closed"


def test_dynamo_close_distinguishes_missing_and_conflict(sample_jobs):
    missing = FakeUpdateTable(error_code="ConditionalCheckFailedException")
    assert make_repo(missing).set_closed("missing", True) is None

    applied = sample_jobs[3].model_dump(mode="json")
    conflict = FakeUpdateTable(error_code="ConditionalCheckFailedException", old_item=applied)
    with pytest.raises(JobConflict):
        make_repo(conflict).set_closed("sample-004", True)


def test_dynamo_close_reraises_other_errors():
    table = FakeUpdateTable(error_code="ProvisionedThroughputExceededException")
    with pytest.raises(ClientError):
        make_repo(table).set_closed("sample-001", True)
