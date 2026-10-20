import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.jobs import Job, get_repository
from app.main import app

SAMPLE = Path(__file__).resolve().parents[2] / "data" / "sample" / "jobs.json"
OWNER_SUB = "owner-sub-123"


def make_settings(**overrides) -> Settings:
    values = dict(
        site_url="https://sehyeokkim.com",
        table_name="sehyeokkim-jobs",
        google_client_id="client-id.apps.googleusercontent.com",
        google_client_secret="client-secret",
        jwt_key="test-jwt-key-that-is-long-enough-for-hs256",
        allowed_sub=OWNER_SUB,
    )
    values.update(overrides)
    return Settings(**values)


class FakeRepository:
    def __init__(self, jobs: list[Job]):
        self.jobs = jobs

    def list_jobs(self) -> list[Job]:
        from app.jobs import sort_key

        return sorted(self.jobs, key=sort_key)

    def mark_applied(self, job_id, applied_via, applied_at):
        for i, job in enumerate(self.jobs):
            if job.id == job_id:
                self.jobs[i] = job.model_copy(update={"status": "applied", "applied_via": applied_via, "applied_at": applied_at})
                return self.jobs[i]
        return None


@pytest.fixture
def sample_jobs() -> list[Job]:
    return [Job(**item) for item in json.loads(SAMPLE.read_text(encoding="utf-8"))]


@pytest.fixture
def settings() -> Settings:
    return make_settings()


@pytest.fixture
def client(settings, sample_jobs):
    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_repository] = lambda: FakeRepository(sample_jobs)
    # 쿠키가 Secure라서 https 주소로 요청해야 테스트 클라이언트가 쿠키를 보낸다
    with TestClient(app, base_url="https://testserver", follow_redirects=False) as c:
        yield c
    app.dependency_overrides.clear()
