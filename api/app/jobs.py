from datetime import date
from typing import Annotated, Literal, Protocol

import boto3
from botocore.exceptions import ClientError
from fastapi import Depends
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, StrictBool

from app.config import Settings, get_settings

Status = Literal["new", "candidate", "applied", "excluded", "closed", "dismissed"]
# 마감 · 관심없음 표시를 취소하면 돌아갈 수 있는 상태 (지원 완료 공고는 마감 · 관심없음으로 바꾸지 않는다)
OpenStatus = Literal["new", "candidate", "excluded"]
Fit = Literal["high", "mid", "low"]
ShortText = Annotated[str, Field(max_length=80)]
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
    # 직무 · 지원 자격(신입 · 인턴 등) · 연봉 조건은 짧은 값만. 연봉은 출처를 함께 적는다 (예: "3,600만 원 (공고)")
    role: ShortText | None = None
    career: ShortText | None = None
    salary: ShortText | None = None
    applied_at: date | None = None
    applied_via: Channel | None = None
    # 화면에서 마감으로 표시하기 전 상태. 마감 취소 때 이 값으로 되돌린다
    closed_from: OpenStatus | None = None
    # 화면에서 관심없음으로 표시하기 전 상태. 취소 때 이 값으로 되돌린다
    dismissed_from: OpenStatus | None = None


class ApplyRequest(BaseModel):
    """지원 완료로 바꾸는 요청. 지금은 지원 완료만 받는다."""

    model_config = ConfigDict(extra="forbid")

    status: Literal["applied"]
    applied_via: Channel


class CloseRequest(BaseModel):
    """마감으로 표시(true)하거나 그 표시를 취소(false)하는 요청."""

    model_config = ConfigDict(extra="forbid")

    # "yes" · 1 같은 값이 true로 바뀌지 않게 JSON 불리언만 받는다
    closed: StrictBool


class DismissRequest(BaseModel):
    """관심없음으로 표시(true)하거나 그 표시를 취소(false)하는 요청."""

    model_config = ConfigDict(extra="forbid")

    dismissed: StrictBool


class JobConflict(Exception):
    """공고는 있지만 지금 상태에서는 바꿀 수 없음 (예: 지원 완료 공고를 마감으로 표시)."""


def sort_key(job: Job) -> tuple:
    # 마감일이 빠른 순, 상시 공고는 뒤
    return (job.deadline is None, job.deadline or date.max, job.company)


def _to_job(item: dict) -> Job:
    # expires_at(TTL)은 저장용 속성이라 응답에서 뺀다
    return Job(**{k: v for k, v in item.items() if k != "expires_at"})


class JobRepository(Protocol):
    def list_jobs(self) -> list[Job]: ...

    def mark_applied(self, job_id: str, applied_via: str, applied_at: date) -> Job | None: ...

    def set_closed(self, job_id: str, closed: bool) -> Job | None: ...

    def set_dismissed(self, job_id: str, dismissed: bool) -> Job | None: ...


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
                UpdateExpression="SET #status = :status, applied_at = :at, applied_via = :via REMOVE closed_from, dismissed_from",
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

    def set_closed(self, job_id: str, closed: bool) -> Job | None:
        """마감 표시 · 취소. 없는 공고면 None, 지금 상태에서 바꿀 수 없으면 JobConflict.

        마감: 지원 완료 · 마감 · 관심없음이 아닌 공고만. 이전 상태를 closed_from에 남긴다
        취소: 마감인 공고만. closed_from으로 되돌리고, 값이 없으면(적재 파일에서 마감으로 넣은 공고) new
        """
        return self._set_hidden(job_id, "closed", closed)

    def set_dismissed(self, job_id: str, dismissed: bool) -> Job | None:
        """관심없음 표시 · 취소. 규칙은 마감과 같고 이전 상태는 dismissed_from에 남긴다."""
        return self._set_hidden(job_id, "dismissed", dismissed)

    def _set_hidden(self, job_id: str, hidden: Literal["closed", "dismissed"], on: bool) -> Job | None:
        # 목록에서 숨기는 상태(마감 · 관심없음)로 바꾸거나 되돌린다. 이전 상태는 <상태>_from 속성에 둔다
        prev = f"{hidden}_from"
        if on:
            # SET의 오른쪽은 바꾸기 전 값이라 이전 상태가 그대로 남는다
            update = f"SET {prev} = #status, #status = :{hidden}"
            condition = "attribute_exists(id) AND #status IN (:new, :candidate, :excluded)"
            values = {f":{hidden}": hidden, ":new": "new", ":candidate": "candidate", ":excluded": "excluded"}
        else:
            update = f"SET #status = if_not_exists({prev}, :new) REMOVE {prev}"
            condition = f"attribute_exists(id) AND #status = :{hidden}"
            values = {f":{hidden}": hidden, ":new": "new"}
        try:
            resp = self.table.update_item(
                Key={"id": job_id},
                UpdateExpression=update,
                ConditionExpression=condition,
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues=values,
                ReturnValues="ALL_NEW",
                # 조건이 틀렸을 때 기존 항목을 받아 "없는 공고"와 "상태가 안 맞음"을 구분한다 (GetItem을 한 번 더 하지 않게)
                ReturnValuesOnConditionCheckFailure="ALL_OLD",
            )
        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                if e.response.get("Item"):
                    raise JobConflict(job_id) from e
                return None
            raise
        return _to_job(resp["Attributes"])

def get_repository(settings: Settings = Depends(get_settings)) -> JobRepository:
    return DynamoJobRepository(settings.table_name)
