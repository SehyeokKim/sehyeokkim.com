import time
import urllib.parse

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

from app import auth
from app.config import get_settings
from app.main import app
from tests.conftest import OWNER_SUB, make_settings


def start_login(client) -> dict:
    """로그인을 시작하고 Google로 보낼 주소의 쿼리 값을 돌려준다."""
    resp = client.get("/api/auth/login")
    assert resp.status_code == 302
    location = urllib.parse.urlparse(resp.headers["location"])
    assert location.netloc == "accounts.google.com"
    return dict(urllib.parse.parse_qsl(location.query))


def fake_google(monkeypatch, sub: str, nonce_from=None, nonce: str | None = None):
    """토큰 교환과 ID 토큰 검증을 가짜로 바꾼다. nonce_from이 주어지면 로그인 시작 때의 nonce를 그대로 돌려준다."""
    monkeypatch.setattr(auth, "exchange_code", lambda code, verifier, settings: "id-token")

    def verify(id_token, settings):
        return {"sub": sub, "nonce": nonce if nonce is not None else nonce_from["nonce"]}

    monkeypatch.setattr(auth, "verify_id_token", verify)


def test_login_redirects_to_google_with_pkce_and_tx_cookie(client):
    query = start_login(client)
    assert query["scope"] == "openid"
    assert query["code_challenge_method"] == "S256"
    assert query["redirect_uri"] == "https://sehyeokkim.com/api/auth/callback"
    assert {"state", "nonce", "code_challenge"} <= query.keys()

    cookie = client.cookies.jar
    tx = next(c for c in cookie if c.name == auth.TX_COOKIE)
    assert tx.path == "/api/auth" and tx.secure


def test_callback_success_sets_session_and_goes_to_jobs(client, monkeypatch):
    query = start_login(client)
    fake_google(monkeypatch, OWNER_SUB, nonce_from=query)

    resp = client.get("/api/auth/callback", params={"code": "c", "state": query["state"]})
    assert resp.status_code == 302
    assert resp.headers["location"] == "/private/jobs/"

    set_cookie = ";".join(resp.headers.get_list("set-cookie")).lower()
    assert "session=" in set_cookie
    assert "samesite=strict" in set_cookie and "httponly" in set_cookie and "secure" in set_cookie
    # 브라우저를 끄면 사라지는 세션 쿠키여야 한다
    session_header = next(h for h in resp.headers.get_list("set-cookie") if h.startswith("session="))
    assert "max-age" not in session_header.lower() and "expires" not in session_header.lower()

    jobs = client.get("/api/jobs")
    assert jobs.status_code == 200
    deadlines = [item["deadline"] for item in jobs.json()["items"]]
    assert deadlines == ["2026-10-22", "2026-10-24", "2026-10-31", None]


def test_callback_with_wrong_state_fails(client, monkeypatch):
    query = start_login(client)
    fake_google(monkeypatch, OWNER_SUB, nonce_from=query)
    resp = client.get("/api/auth/callback", params={"code": "c", "state": "forged"})
    assert resp.headers["location"] == "/private/?error=login"
    assert client.get("/api/jobs").status_code == 401


def test_callback_without_tx_cookie_fails(client, monkeypatch):
    query = start_login(client)
    fake_google(monkeypatch, OWNER_SUB, nonce_from=query)
    client.cookies.clear()
    resp = client.get("/api/auth/callback", params={"code": "c", "state": query["state"]})
    assert resp.headers["location"] == "/private/?error=login"


def test_callback_with_wrong_nonce_fails(client, monkeypatch):
    query = start_login(client)
    fake_google(monkeypatch, OWNER_SUB, nonce="replayed")
    resp = client.get("/api/auth/callback", params={"code": "c", "state": query["state"]})
    assert resp.headers["location"] == "/private/?error=login"


def test_callback_when_google_returns_error(client):
    query = start_login(client)
    resp = client.get("/api/auth/callback", params={"error": "access_denied", "state": query["state"]})
    assert resp.headers["location"] == "/private/?error=login"


def test_other_account_is_denied(client, monkeypatch):
    query = start_login(client)
    fake_google(monkeypatch, "someone-else", nonce_from=query)
    resp = client.get("/api/auth/callback", params={"code": "c", "state": query["state"]})
    assert resp.headers["location"] == "/private/?error=denied"
    assert client.get("/api/jobs").status_code == 401


def test_setup_mode_shows_own_sub_without_session(client, monkeypatch):
    app.dependency_overrides[get_settings] = lambda: make_settings(allowed_sub="UNSET")
    query = start_login(client)
    fake_google(monkeypatch, "new-owner-sub", nonce_from=query)
    resp = client.get("/api/auth/callback", params={"code": "c", "state": query["state"]})
    assert resp.status_code == 200
    assert "new-owner-sub" in resp.text
    assert "new-owner-sub" not in resp.headers.get("location", "")
    assert client.get("/api/jobs").status_code == 401


def test_tx_token_cannot_be_used_as_session(client, settings):
    _, tx = auth.start_login(settings)
    client.cookies.set(auth.SESSION_COOKIE, tx)
    assert client.get("/api/me").status_code == 401


def test_jobs_requires_session(client):
    resp = client.get("/api/jobs")
    assert resp.status_code == 401
    assert resp.headers["cache-control"] == "no-store"


def test_tampered_session_is_rejected(client, settings):
    token = auth.issue_session(settings)
    client.cookies.set(auth.SESSION_COOKIE, token[:-2] + "xx")
    assert client.get("/api/me").status_code == 401


def test_expired_session_is_rejected(client, settings):
    token = jwt.encode(
        {"purpose": "session", "start": int(time.time()) - 3 * 3600, "exp": int(time.time()) - 60},
        settings.jwt_key,
        algorithm="HS256",
    )
    client.cookies.set(auth.SESSION_COOKIE, token)
    assert client.get("/api/me").status_code == 401


def test_session_older_than_12_hours_is_rejected(client, settings):
    start = int(time.time()) - 13 * 3600
    token = jwt.encode({"purpose": "session", "start": start, "exp": int(time.time()) + 3600}, settings.jwt_key, algorithm="HS256")
    client.cookies.set(auth.SESSION_COOKIE, token)
    assert client.get("/api/me").status_code == 401


def test_session_is_extended_on_activity(client, settings):
    start = int(time.time()) - 3600
    token = jwt.encode({"purpose": "session", "start": start, "exp": int(time.time()) + 60}, settings.jwt_key, algorithm="HS256")
    client.cookies.set(auth.SESSION_COOKIE, token)
    resp = client.get("/api/me")
    assert resp.status_code == 200
    renewed = jwt.decode(resp.cookies[auth.SESSION_COOKIE], settings.jwt_key, algorithms=["HS256"])
    assert renewed["start"] == start
    assert renewed["exp"] >= int(time.time()) + auth.SESSION_SECONDS - 5


def test_logout_clears_session(client, settings):
    client.cookies.set(auth.SESSION_COOKIE, auth.issue_session(settings))
    resp = client.post("/api/auth/logout")
    assert resp.status_code == 204
    assert 'session=""' in resp.headers["set-cookie"] or "max-age=0" in resp.headers["set-cookie"].lower()


@pytest.fixture
def google_key(monkeypatch):
    """Google 공개키 대신 테스트용 RSA 키로 서명을 확인하게 한다."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    class Signing:
        def __init__(self):
            self.key = key.public_key()

    monkeypatch.setattr(auth._jwks_client, "get_signing_key_from_jwt", lambda token: Signing())
    return key


def _id_token(key, settings, **overrides):
    now = int(time.time())
    claims = {"iss": "https://accounts.google.com", "aud": settings.google_client_id, "sub": OWNER_SUB, "iat": now, "exp": now + 300}
    claims.update(overrides)
    return jwt.encode(claims, key, algorithm="RS256")


def test_verify_id_token_accepts_valid_google_token(google_key, settings):
    assert auth.verify_id_token(_id_token(google_key, settings), settings)["sub"] == OWNER_SUB


@pytest.mark.parametrize(
    "overrides",
    [
        {"aud": "another-client"},
        {"iss": "https://evil.example.com"},
        {"exp": int(time.time()) - 10},
    ],
)
def test_verify_id_token_rejects_bad_claims(google_key, settings, overrides):
    with pytest.raises(auth.LoginError):
        auth.verify_id_token(_id_token(google_key, settings, **overrides), settings)


def test_verify_id_token_rejects_wrong_signature(google_key, settings):
    other = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    with pytest.raises(auth.LoginError):
        auth.verify_id_token(_id_token(other, settings), settings)
