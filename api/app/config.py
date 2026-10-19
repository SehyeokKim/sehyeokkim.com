import os
import time
from dataclasses import dataclass

import boto3

# 비밀값은 SSM Parameter Store에 두고 실행 중에 읽는다 (ADR 0008).
# 값을 바꾸면 늦어도 이 시간 안에 반영된다
CACHE_SECONDS = 300

UNSET = "UNSET"


@dataclass(frozen=True)
class Settings:
    site_url: str
    table_name: str
    google_client_id: str
    google_client_secret: str
    jwt_key: str
    allowed_sub: str

    @property
    def redirect_uri(self) -> str:
        return f"{self.site_url}/api/auth/callback"


_cache: tuple[float, Settings] | None = None


def get_settings() -> Settings:
    global _cache
    now = time.monotonic()
    if _cache and now - _cache[0] < CACHE_SECONDS:
        return _cache[1]

    prefix = os.environ["SSM_PREFIX"]
    names = {
        "google_client_id": f"{prefix}/google/client_id",
        "google_client_secret": f"{prefix}/google/client_secret",
        "jwt_key": f"{prefix}/auth/jwt_key",
        "allowed_sub": f"{prefix}/auth/allowed_sub",
    }
    resp = boto3.client("ssm").get_parameters(Names=list(names.values()), WithDecryption=True)
    if resp["InvalidParameters"]:
        raise RuntimeError(f"SSM 파라미터가 없습니다: {', '.join(resp['InvalidParameters'])}")
    values = {p["Name"]: p["Value"] for p in resp["Parameters"]}

    settings = Settings(
        site_url=os.environ["SITE_URL"],
        table_name=os.environ["TABLE_NAME"],
        **{key: values[name] for key, name in names.items()},
    )
    _cache = (now, settings)
    return settings
