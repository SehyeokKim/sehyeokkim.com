import base64
import hashlib
import hmac
import json
import secrets
import time
import urllib.parse
import urllib.request

import jwt
from fastapi import Depends, HTTPException, Request, Response

from app.config import Settings, get_settings

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = ("https://accounts.google.com", "accounts.google.com")

TX_COOKIE = "oauth_tx"
TX_SECONDS = 600
SESSION_COOKIE = "session"
SESSION_SECONDS = 2 * 60 * 60
SESSION_MAX_SECONDS = 12 * 60 * 60

# 로그인 임시 쿠키와 세션을 같은 키로 서명하므로, 용도를 claim으로 구분해 서로 바꿔 쓰지 못하게 한다
TX_PURPOSE = "oauth_tx"
SESSION_PURPOSE = "session"

_jwks_client = jwt.PyJWKClient(GOOGLE_JWKS_URL, cache_keys=True)


class LoginError(Exception):
    pass


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def start_login(settings: Settings) -> tuple[str, str]:
    """Google 로그인 주소와, state · nonce · PKCE 값을 담은 서명된 임시 쿠키 값을 만든다."""
    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(64)
    challenge = _b64url(hashlib.sha256(verifier.encode()).digest())

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.redirect_uri,
        "response_type": "code",
        "scope": "openid",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    }
    tx = jwt.encode(
        {"purpose": TX_PURPOSE, "state": state, "nonce": nonce, "verifier": verifier, "exp": int(time.time()) + TX_SECONDS},
        settings.jwt_key,
        algorithm="HS256",
    )
    return f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}", tx


def read_login_tx(token: str | None, state: str | None, settings: Settings) -> dict:
    if not token or not state:
        raise LoginError("로그인 임시 값이 없습니다")
    try:
        tx = jwt.decode(token, settings.jwt_key, algorithms=["HS256"])
    except jwt.InvalidTokenError as e:
        raise LoginError("로그인 임시 값이 유효하지 않습니다") from e
    if tx.get("purpose") != TX_PURPOSE or not hmac.compare_digest(tx["state"], state):
        raise LoginError("state가 일치하지 않습니다")
    return tx


def exchange_code(code: str, verifier: str, settings: Settings) -> str:
    """인가 코드를 Google 토큰으로 바꾸고 ID 토큰을 돌려준다."""
    body = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.redirect_uri,
            "grant_type": "authorization_code",
            "code_verifier": verifier,
        }
    ).encode()
    req = urllib.request.Request(GOOGLE_TOKEN_URL, data=body, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.load(resp)["id_token"]
    except Exception as e:
        raise LoginError("토큰 교환에 실패했습니다") from e


def verify_id_token(id_token: str, settings: Settings) -> dict:
    """Google 공개키로 서명을 확인하고 발급자 · 대상 · 만료를 검사한다."""
    try:
        key = _jwks_client.get_signing_key_from_jwt(id_token).key
        claims = jwt.decode(
            id_token,
            key,
            algorithms=["RS256"],
            audience=settings.google_client_id,
            options={"require": ["iss", "aud", "exp", "iat", "sub"]},
        )
    except jwt.PyJWTError as e:
        raise LoginError("ID 토큰이 유효하지 않습니다") from e
    if claims["iss"] not in GOOGLE_ISSUERS:
        raise LoginError("발급자가 Google이 아닙니다")
    return claims


def issue_session(settings: Settings, start: int | None = None) -> str:
    now = int(time.time())
    start = start or now
    exp = min(now + SESSION_SECONDS, start + SESSION_MAX_SECONDS)
    return jwt.encode({"purpose": SESSION_PURPOSE, "start": start, "exp": exp}, settings.jwt_key, algorithm="HS256")


def set_session_cookie(response: Response, token: str) -> None:
    # Max-Age · Expires를 두지 않아 브라우저를 끄면 사라지는 세션 쿠키가 된다
    response.set_cookie(SESSION_COOKIE, token, path="/api", secure=True, httponly=True, samesite="strict")


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/api", secure=True, httponly=True, samesite="strict")


def require_session(request: Request, response: Response, settings: Settings = Depends(get_settings)) -> dict:
    """세션이 유효하면 만료를 2시간 뒤로 다시 발급한다. 없거나 만료됐으면 401."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="unauthorized")
    try:
        claims = jwt.decode(token, settings.jwt_key, algorithms=["HS256"], options={"require": ["exp", "start"]})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="unauthorized")
    if claims.get("purpose") != SESSION_PURPOSE or time.time() > claims["start"] + SESSION_MAX_SECONDS:
        raise HTTPException(status_code=401, detail="unauthorized")

    set_session_cookie(response, issue_session(settings, start=claims["start"]))
    return claims
