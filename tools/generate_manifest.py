"""Regenerate SOURCE_MANIFEST_v<VERSION>.txt from the files tracked by git.

Usage: python tools/generate_manifest.py [--check]

Hashes are SHA-256 of the content staged in the git index, so they do not
depend on local line-ending conversion. Run after `git add`, before committing.
With --check, exit with status 1 if the manifest is out of date.
"""
from __future__ import annotations

import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git(*args: str, data: bytes | None = None) -> bytes:
    return subprocess.run(["git", *args], cwd=ROOT, input=data, capture_output=True, check=True).stdout


def build(manifest_name: str) -> str:
    paths = [p for p in git("ls-files", "-z").decode("utf-8").split("\0") if p and p != manifest_name]
    paths.sort()
    blobs = git("cat-file", "--batch", data="".join(f":{p}\n" for p in paths).encode("utf-8"))
    lines, offset = [], 0
    for path in paths:
        header_end = blobs.index(b"\n", offset)
        size = int(blobs[offset:header_end].split()[2])
        start = header_end + 1
        content = blobs[start:start + size]
        offset = start + size + 1
        lines.append(f"{hashlib.sha256(content).hexdigest()}  {path}")
    return "\n".join(lines) + "\n"


def main() -> int:
    version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
    name = f"SOURCE_MANIFEST_v{version}.txt"
    content = build(name)
    target = ROOT / name
    if "--check" in sys.argv:
        current = target.read_text(encoding="utf-8").replace("\r\n", "\n") if target.exists() else ""
        if current != content:
            print(f"{name} is out of date; run python tools/generate_manifest.py")
            return 1
        print(f"{name} is up to date")
        return 0
    target.write_text(content, encoding="utf-8", newline="\n")
    print(f"Wrote {name} ({content.count(chr(10))} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
