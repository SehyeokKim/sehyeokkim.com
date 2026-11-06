from datetime import date

import pytest

from app import auth
from app.jobs import DynamoJobRepository
from tests.test_close import FakeUpdateTable, make_repo

SITE = "https://sehyeokkim.com"


def login(client, settings):
    client.cookies.set(auth.SESSION_COOKIE, auth.issue_session(settings))


def patch(client, job_id, body):
    return client.patch(f"/api/jobs/{job_id}", json=body, headers={"Origin": SITE})


def test_dismiss_then_undo_restores_previous_status(client, settings):
    login(client, settings)
    resp = patch(client, "sample-001", {"dismissed": True})
    assert resp.status_code == 200
    assert resp.json()["status"] == "dismissed"
    assert resp.json()["dismissed_from"] == "candidate"

    resp = patch(client, "sample-001", {"dismissed": False})
    assert resp.status_code == 200
    assert resp.json()["status"] == "candidate"
    assert resp.json()["dismissed_from"] is None


def test_dismiss_applied_job_is_409(client, settings):
    login(client, settings)
    assert patch(client, "sample-004", {"dismissed": True}).status_code == 409


def test_dismiss_closed_job_is_409(client, settings):
    login(client, settings)
    assert patch(client, "sample-001", {"closed": True}).status_code == 200
    assert patch(client, "sample-001", {"dismissed": True}).status_code == 409


def test_close_dismissed_job_is_409(client, settings):
    login(client, settings)
    assert patch(client, "sample-001", {"dismissed": True}).status_code == 200
    assert patch(client, "sample-001", {"closed": True}).status_code == 409


def test_undo_job_that_is_not_dismissed_is_409(client, settings):
    login(client, settings)
    assert patch(client, "sample-003", {"dismissed": False}).status_code == 409


def test_dismiss_unknown_job_is_404(client, settings):
    login(client, settings)
    assert patch(client, "no-such-job", {"dismissed": True}).status_code == 404


def test_dismiss_requires_session(client):
    assert patch(client, "sample-001", {"dismissed": True}).status_code == 401


@pytest.mark.parametrize(
    "body",
    [
        {"dismissed": "yes"},  # 불리언만
        {"dismissed": 1},
        {"dismissed": True, "closed": True},  # 한 번에 하나만
        {"dismissed": True, "status": "dismissed"},
        {"status": "dismissed"},
    ],
)
def test_dismiss_rejects_invalid_body(client, settings, body):
    login(client, settings)
    assert patch(client, "sample-001", body).status_code == 422


def test_dynamo_dismiss_keeps_previous_status(sample_jobs):
    item = sample_jobs[0].model_dump(mode="json") | {"status": "dismissed", "dismissed_from": "candidate"}
    table = FakeUpdateTable(result=item)
    job = make_repo(table).set_dismissed("sample-001", True)

    assert job.status == "dismissed" and job.dismissed_from == "candidate"
    assert table.kwargs["UpdateExpression"] == "SET dismissed_from = #status, #status = :dismissed"
    assert "applied" not in table.kwargs["ExpressionAttributeValues"].values()
    assert "closed" not in table.kwargs["ExpressionAttributeValues"].values()


def test_dynamo_undo_dismiss_falls_back_to_new(sample_jobs):
    table = FakeUpdateTable(result=sample_jobs[2].model_dump(mode="json"))
    make_repo(table).set_dismissed("sample-003", False)

    assert table.kwargs["UpdateExpression"] == "SET #status = if_not_exists(dismissed_from, :new) REMOVE dismissed_from"
    assert table.kwargs["ConditionExpression"] == "attribute_exists(id) AND #status = :dismissed"


def test_dynamo_apply_clears_hidden_from(sample_jobs):
    table = FakeUpdateTable(result=sample_jobs[0].model_dump(mode="json"))
    repo: DynamoJobRepository = make_repo(table)
    repo.mark_applied("sample-001", "company", date(2026, 11, 6))
    assert table.kwargs["UpdateExpression"].endswith("REMOVE closed_from, dismissed_from")
