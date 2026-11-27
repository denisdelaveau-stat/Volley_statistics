"""Print GitHub Actions error annotations for the failing tests of a pytest log.

Usage: python tools/ci_annotate_failures.py pytest.log

Each failing test gives one annotation with its first error lines, so failures can be read on the run page and
through the public check-runs API (job logs need authentication).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

MAX_LINES = 12


def sections(log: str) -> dict[str, list[str]]:
    """Error lines ("E   ..." and the failing source line ">") of each failure section of the log."""
    out: dict[str, list[str]] = {}
    current = None
    for line in log.splitlines():
        header = re.match(r"^_{3,} (.+?) _{3,}$", line)
        if header:
            current = header.group(1).strip()
            out[current] = []
        elif current and (line.startswith("E ") or line.startswith(">")):
            out[current].append(line.rstrip())
    return out


def main() -> int:
    log = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
    details = sections(log)
    for line in log.splitlines():
        if not re.match(r"^(FAILED|ERROR) ", line):
            continue
        node = line.split(" ", 1)[1].split(" - ", 1)[0]
        name = node.split("::")[-1]
        lines = details.get(name, [])[:MAX_LINES] or [line]
        message = "%0A".join(l.replace("%", "%25").replace("\r", "") for l in lines)
        print(f"::error title={node[:200]}::{message[:4000]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
