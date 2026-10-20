import pytest
from pydantic import ValidationError

from app.jobs import DynamoJobRepository, Job


class FakeTable:
    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def scan(self, **kwargs):
        self.calls.append(kwargs)
        return self.pages[len(self.calls) - 1]


def test_dynamo_repository_reads_all_pages_and_sorts(sample_jobs):
    items = [job.model_dump(mode="json") | {"expires_at": 1893456000} for job in sample_jobs]
    repo = DynamoJobRepository.__new__(DynamoJobRepository)
    repo.table = FakeTable(
        [
            {"Items": items[:2], "LastEvaluatedKey": {"id": items[1]["id"]}},
            {"Items": items[2:]},
        ]
    )
    jobs = repo.list_jobs()
    assert len(repo.table.calls) == 2
    assert repo.table.calls[1]["ExclusiveStartKey"] == {"id": items[1]["id"]}
    assert [str(j.deadline) if j.deadline else None for j in jobs] == ["2026-10-22", "2026-10-24", "2026-10-31", None]


def test_job_rejects_fields_outside_the_allowed_set(sample_jobs):
    data = sample_jobs[0].model_dump(mode="json") | {"body": "공고 본문 전체"}
    with pytest.raises(ValidationError):
        Job(**data)


def test_job_rejects_unknown_status(sample_jobs):
    data = sample_jobs[0].model_dump(mode="json") | {"status": "maybe"}
    with pytest.raises(ValidationError):
        Job(**data)


def test_job_accepts_role_career_salary(sample_jobs):
    data = sample_jobs[0].model_dump(mode="json") | {
        "role": "클라우드 엔지니어",
        "career": "신입",
        "salary": "약 6,330만 원 (국민연금 재직자 평균, 초봉 아님)",
    }
    job = Job(**data)
    assert job.role == "클라우드 엔지니어" and job.salary.startswith("약")


def test_job_rejects_long_salary_text(sample_jobs):
    # 짧은 값만 받는다 (공고 본문 · 복지 같은 긴 글이 들어오지 않게)
    data = sample_jobs[0].model_dump(mode="json") | {"salary": "가" * 81}
    with pytest.raises(ValidationError):
        Job(**data)
