from datetime import date
from typing import Annotated, Literal, Protocol

import boto3
from botocore.exceptions import ClientError
from fastapi import Depends
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from app.config import Settings, get_settings

Status = Literal["new", "candidate", "applied", "excluded"]
Fit = Literal["high", "mid", "low"]
# 지원 경로: 공고 원문의 도메인(예: jobs.example.com) 또는 company(회사 채용 페이지)
Channel = Annotated[str, Field(max_length=253, pattern=r"^(company|[a-z0-9-]+(\.[a-z0-9-]+)+)$")]


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
    applied_at: date | None = None
    applied_via: Channel | None = None


class ApplyRequest(BaseModel):
    """지원 완료로 바꾸는 요청. 지금은 지원 완료만 받는다."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["applied"]
    applied_via: Channel


def sort_key(job: Job) -> tuple:
    # 마감일이 빠른 순, 상시 공고는 뒤
    return (job.deadline is None, job.deadline or date.max, job.company)


def _to_job(item: dict) -> Job:
    # expires_at(TTL)은 저장용 속성이라 응답에서 뺀다
    return Job(**{k: v for k, v in item.items() if k != "expires_at"})


class JobRepository(Protocol):
    def list_jobs(self) -> list[Job]: ...

    def mark_applied(self, job_id: str, applied_via: str, applied_at: date) -> Job | None: ...


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
        return sorted((_to_job(item) for item in items), key=sort_key)

    def mark_applied(self, job_id: str, applied_via: str, applied_at: date) -> Job | None:
        """상태 · 지원일 · 지원 경로만 바꾼다. 없는 공고면 새로 만들지 않고 None."""
        try:
            resp = self.table.update_item(
                Key={"id": job_id},
                UpdateExpression="SET #status = :status, applied_at = :at, applied_via = :via",
                ConditionExpression="attribute_exists(id)",
                ExpressionAttributeNames={"#status": "status"},  # status는 DynamoDB 예약어
                ExpressionAttributeValues={":status": "applied", ":at": applied_at.isoformat(), ":via": applied_via},
                ReturnValues="ALL_NEW",
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                return None
            raise
        return _to_job(resp["Attributes"])


def get_repository(settings: Settings = Depends(get_settings)) -> JobRepository:
    return DynamoJobRepository(settings.table_name)
