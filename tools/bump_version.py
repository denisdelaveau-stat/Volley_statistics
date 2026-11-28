"""Bump the VolleyLive release version everywhere it is used at runtime.

Usage: python tools/bump_version.py 1.29.0

Updates VERSION, the service-worker cache name and header and the README title. Tests read VERSION, so they
follow automatically. The Home label shows the branch and build number instead (tools/stamp_build.py, run by the
pre-commit hook), which also adds the build number to the cache name at the next commit.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# (file, pattern, replacement template) — each pattern must match exactly once.
TARGETS = [
    ("sw.js", r"var CACHE = 'volley-live-capture-v[^']*';", "var CACHE = 'volley-live-capture-v{v}';"),
    ("sw.js", r"^/\* Volley Live Capture v[\d.]+", "/* Volley Live Capture v{v}"),
    ("README.md", r"^# VolleyLive v[\d.]+", "# VolleyLive v{v}"),
]


def bump(version: str) -> None:
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise SystemExit(f"Invalid version {version!r}; expected MAJOR.MINOR.PATCH")
    updates = {}
    for name, pattern, template in TARGETS:
        text = updates.get(name) or (ROOT / name).read_text(encoding="utf-8")
        new_text, count = re.subn(pattern, template.format(v=version), text, flags=re.M)
        if count != 1:
            raise SystemExit(f"{name}: expected exactly one match for {pattern!r}, found {count}")
        updates[name] = new_text
    for name, text in updates.items():
        (ROOT / name).write_text(text, encoding="utf-8", newline="")
    (ROOT / "VERSION").write_text(version + "\n", encoding="utf-8", newline="")
    print(f"Version set to {version}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    bump(sys.argv[1])
