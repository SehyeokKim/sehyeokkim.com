"""Lambda 배포 패키지(api/dist/lambda.zip)를 만든다.

Lambda는 arm64 Linux라서, 어느 OS에서 실행하든 그 환경용 바이너리 휠을 받는다.
같은 입력이면 같은 zip이 나오도록 파일 순서와 시각을 고정한다 (Terraform이 바뀐 것으로 오인하지 않게).

실행: python api/scripts/build_lambda.py
"""

import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

API = Path(__file__).resolve().parents[1]
DIST = API / "dist"
PACKAGE = DIST / "package"
ZIP = DIST / "lambda.zip"
FIXED_TIME = (2026, 1, 1, 0, 0, 0)


def main() -> None:
    shutil.rmtree(DIST, ignore_errors=True)
    PACKAGE.mkdir(parents=True)

    subprocess.run(
        [
            sys.executable, "-m", "pip", "install", "--quiet", "--no-deps", "--disable-pip-version-check",
            "--platform", "manylinux2014_aarch64", "--implementation", "cp", "--python-version", "3.12",
            "--only-binary=:all:", "--target", str(PACKAGE), "-r", str(API / "requirements.txt"),
        ],
        check=True,
    )
    shutil.copytree(API / "app", PACKAGE / "app", ignore=shutil.ignore_patterns("__pycache__"))

    # bin/(콘솔 실행 파일)과 RECORD는 실행에 쓰이지 않고, Windows에서 만들면 빌드마다 내용이 달라져 뺀다
    files = sorted(
        p
        for p in PACKAGE.rglob("*")
        if p.is_file()
        and "__pycache__" not in p.parts
        and p.relative_to(PACKAGE).parts[0] != "bin"
        and p.name != "RECORD"
    )
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in files:
            info = zipfile.ZipInfo(path.relative_to(PACKAGE).as_posix(), date_time=FIXED_TIME)
            info.external_attr = 0o644 << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, path.read_bytes())

    print(f"{ZIP} ({ZIP.stat().st_size // 1024} KB, {len(files)} files)")


if __name__ == "__main__":
    main()
