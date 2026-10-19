from datetime import date
from typing import Literal, Protocol

import boto3
from fastapi import Depends
from pydantic import BaseModel, ConfigDict, HttpUrl

from app.config import Settings, get_settings

Status = Literal["new", "candidate", "applied", "excluded"]
Fit = Literal["high", "mid", "low"]


class Job(BaseModel):
    """저장하는 항목은 이것뿐이다. 공고 본문 · 리뷰 원문 · 담당자 개인정보는 받지 않는다."""

    model_config = ConfigDict(extra="forbid")

    id: str
    company: str
    title: str
    url: HttpUrl
    deadline: date | None = None
    location: str | None = None
    employment_type: str | None = None
    source: str
    status: Status = "new"
    fit: Fit | None = None
    memo: str | None = None
    collected_at: date


def sort_key(job: Job) -> tuple:
    # 마감일이 빠른 순, 상시 공고는 뒤
    return (job.deadline is None, job.deadline or date.max, job.company)


class JobRepository(Protocol):
    def list_jobs(self) -> list[Job]: ...


class DynamoJobRepository:
    def __init__(self, table_name: str):
        self.table = boto3.resource("dynamodb").Table(table_name)

    def list_jobs(self) -> list[Job]:
        items: list[dict] = []
        kwargs: dict = {}
        while True:
            page = self.table.scan(**kwargs)
            items.extend(page["Items"])
            if "LastEvaluatedKey" not in page:
                break
            kwargs["ExclusiveStartKey"] = page["LastEvaluatedKey"]
        # expires_at(TTL)은 저장용 속성이라 응답에서 뺀다
        return sorted((Job(**{k: v for k, v in item.items() if k != "expires_at"}) for item in items), key=sort_key)


def get_repository(settings: Settings = Depends(get_settings)) -> JobRepository:
    return DynamoJobRepository(settings.table_name)
