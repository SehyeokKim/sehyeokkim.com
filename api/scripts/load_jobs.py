"""공고 JSON을 검사하고, 바뀌는 내용을 보여 준 뒤 승인하면 DynamoDB에 넣는다.

공고 파일은 저장소 밖(last-plank 저장소의 private/jobs/, Git 제외)에 둔다. 형식은 docs/api.md의 공고 필드와 같다.
로컬 SSO 프로필로만 실행한다. 배포 역할에는 DynamoDB 쓰기 권한이 없다.

실행: python api/scripts/load_jobs.py ../../last-plank/private/jobs/jobs.json --profile sehyeokkim
"""

import argparse
import json
import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

import boto3
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.jobs import Job  # noqa: E402

KST = timezone(timedelta(hours=9))


def expires_at(job: Job) -> int:
    # 마감 30일 뒤, 상시 공고는 수집 90일 뒤 DynamoDB TTL로 자동 삭제
    base = job.deadline + timedelta(days=30) if job.deadline else job.collected_at + timedelta(days=90)
    return int(datetime.combine(base, time(), KST).timestamp())


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--profile", required=True)
    parser.add_argument("--table", default="sehyeokkim-jobs")
    parser.add_argument("--region", default="ap-northeast-2")
    parser.add_argument("--prune", action="store_true", help="파일에 없는 공고를 삭제")
    parser.add_argument("--yes", action="store_true", help="확인 질문 없이 반영")
    args = parser.parse_args()

    try:
        jobs = [Job(**item) for item in json.loads(args.path.read_text(encoding="utf-8"))]
    except (ValidationError, json.JSONDecodeError) as e:
        print(f"형식 오류로 중단합니다:\n{e}")
        return 1
    ids = [j.id for j in jobs]
    if len(ids) != len(set(ids)):
        print("같은 id가 두 번 이상 있어 중단합니다.")
        return 1

    table = boto3.Session(profile_name=args.profile, region_name=args.region).resource("dynamodb").Table(args.table)
    current: dict[str, dict] = {}
    kwargs: dict = {}
    while True:
        page = table.scan(**kwargs)
        current.update({item["id"]: item for item in page["Items"]})
        if "LastEvaluatedKey" not in page:
            break
        kwargs["ExclusiveStartKey"] = page["LastEvaluatedKey"]

    new_items = {j.id: j.model_dump(mode="json", exclude_none=True) | {"expires_at": expires_at(j)} for j in jobs}
    # 화면에서 지원 완료로 바꾼 공고는 파일 내용으로 상태를 되돌리지 않는다
    for i, item in new_items.items():
        if current.get(i, {}).get("status") == "applied":
            item.update({k: current[i][k] for k in ("status", "applied_at", "applied_via") if k in current[i]})
    added = [i for i in new_items if i not in current]
    changed = [i for i in new_items if i in current and current[i] != new_items[i]]
    removed = [i for i in current if i not in new_items] if args.prune else []

    print(f"새 공고 {len(added)} · 변경 {len(changed)} · 삭제 {len(removed)} · 그대로 {len(new_items) - len(added) - len(changed)}")
    for label, keys in (("+", added), ("~", changed), ("-", removed)):
        for i in keys:
            item = new_items.get(i) or current[i]
            print(f"  {label} {item['company']} | {item['title']} | 마감 {item.get('deadline', '상시')}")

    if not (added or changed or removed):
        return 0
    if not args.yes and input("반영할까요? (y/N) ").strip().lower() != "y":
        print("반영하지 않았습니다.")
        return 0

    with table.batch_writer() as batch:
        for i in added + changed:
            batch.put_item(Item=new_items[i])
        for i in removed:
            batch.delete_item(Key={"id": i})
    print(f"반영했습니다 ({date.today()}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
