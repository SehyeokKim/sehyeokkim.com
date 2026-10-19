import hmac
import html

from fastapi import Depends, FastAPI, Request, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from mangum import Mangum

from app import auth
from app.config import UNSET, Settings, get_settings
from app.jobs import JobRepository, get_repository

# 문서 화면(/docs, /openapi.json)은 공개 주소에 노출하지 않는다
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)

AFTER_LOGIN = "/private/jobs/"
LOGIN_FAILED = "/private/?error=login"
LOGIN_DENIED = "/private/?error=denied"


@app.middleware("http")
async def no_store(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Robots-Tag"] = "noindex"
    return response


def _clear_tx(response: Response) -> None:
    response.delete_cookie(auth.TX_COOKIE, path="/api/auth", secure=True, httponly=True, samesite="lax")


@app.get("/api/auth/login")
def login(settings: Settings = Depends(get_settings)):
    url, tx = auth.start_login(settings)
    response = RedirectResponse(url, status_code=302)
    # Google에서 돌아오는 요청은 다른 사이트에서 시작된 이동이라 SameSite=Lax여야 쿠키가 따라온다
    response.set_cookie(
        auth.TX_COOKIE, tx, max_age=auth.TX_SECONDS, path="/api/auth", secure=True, httponly=True, samesite="lax"
    )
    return response


@app.get("/api/auth/callback")
def callback(request: Request, settings: Settings = Depends(get_settings)):
    params = request.query_params
    try:
        if "error" in params or "code" not in params:
            raise auth.LoginError("Google에서 로그인을 끝내지 않았습니다")
        tx = auth.read_login_tx(request.cookies.get(auth.TX_COOKIE), params.get("state"), settings)
        claims = auth.verify_id_token(auth.exchange_code(params["code"], tx["verifier"], settings), settings)
        if not hmac.compare_digest(str(claims.get("nonce", "")), tx["nonce"]):
            raise auth.LoginError("nonce가 일치하지 않습니다")
    except auth.LoginError:
        response = RedirectResponse(LOGIN_FAILED, status_code=302)
        _clear_tx(response)
        return response

    sub = claims["sub"]
    if settings.allowed_sub == UNSET:
        # 처음 설정: 방금 로그인한 본인의 계정 ID만 보여 주고 세션은 주지 않는다 (URL에는 싣지 않음)
        response = HTMLResponse(_setup_page(sub))
    elif hmac.compare_digest(sub, settings.allowed_sub):
        response = RedirectResponse(AFTER_LOGIN, status_code=302)
        auth.set_session_cookie(response, auth.issue_session(settings))
    else:
        response = RedirectResponse(LOGIN_DENIED, status_code=302)
    _clear_tx(response)
    return response


@app.post("/api/auth/logout", status_code=204)
def logout():
    response = Response(status_code=204)
    auth.clear_session_cookie(response)
    return response


@app.get("/api/me")
def me(_: dict = Depends(auth.require_session)):
    return {"authenticated": True}


@app.get("/api/jobs")
def list_jobs(_: dict = Depends(auth.require_session), repo: JobRepository = Depends(get_repository)):
    return {"items": [job.model_dump(mode="json") for job in repo.list_jobs()]}


def _setup_page(sub: str) -> str:
    return f"""<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>로그인 설정</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:15vh auto;padding:0 24px;line-height:1.6">
<h1 style="font-size:1.4rem">허용 계정이 아직 설정되지 않았습니다</h1>
<p>방금 로그인한 Google 계정의 ID입니다. SSM 파라미터 <code>auth/allowed_sub</code>에 이 값을 넣으면 이 계정으로 로그인할 수 있습니다.</p>
<p><code style="font-size:1.1rem;user-select:all">{html.escape(sub)}</code></p>
<p><a href="/private/">돌아가기</a></p>
</body></html>"""


handler = Mangum(app, lifespan="off")
