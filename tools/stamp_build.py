"""Stamp the current branch and build number into the app before each commit.

Run by the pre-commit hook (.githooks/pre-commit). The build number is the number of commits on the current
branch once this commit is made, so it grows with every commit (and therefore with every push).

- index.html: the Home version label shows "<branch> · build <n>".
- sw.js: the cache name gets "-b<n>", so installed phones download the new version after each push.
"""
from __future__ import annotations

import html
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()


def rewrite(path: Path, pattern: str, replacement: str) -> None:
    text = path.read_text(encoding="utf-8")
    new, count = re.subn(pattern, replacement, text, count=1)
    if count != 1:
        raise SystemExit(f"stamp_build: pattern not found in {path.name}")
    if new != text:
        path.write_bytes(new.encode("utf-8"))


def main() -> None:
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    try:
        count = int(git("rev-list", "--count", "HEAD"))
    except subprocess.CalledProcessError:  # first commit of the repository
        count = 0
    build = count + 1
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    label = f"{html.escape(branch)} · build {build}"
    rewrite(
        ROOT / "index.html",
        r'<div class="home-version" id="appVersion">[^<]*</div>',
        f'<div class="home-version" id="appVersion">{label}</div>',
    )
    rewrite(ROOT / "sw.js", r"var CACHE = '[^']*';", f"var CACHE = 'volley-live-capture-v{version}-b{build}';")
    git("add", "index.html", "sw.js")
    print(f"stamp_build: {branch} · build {build}")


if __name__ == "__main__":
    main()
