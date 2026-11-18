"""Shared browser fixtures for Volley Live Capture v1.6.10 tests."""
from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_URI = (ROOT / "index.html").as_uri()
CHROMIUM = os.environ.get("CHROMIUM_PATH", "/opt/pw-browsers/chromium-1228/chrome-linux64/chrome")


def base_match(level: str = "advanced", focus_off=(4,)) -> dict:
    positions = ("setter", "libero", "oh", "mb", "oh", "mb", "opp", "oh")
    return {
        "id": "test_match",
        "name": "Antibes_vs_Nice_test",
        "status": "in_progress",
        "createdAt": "2026-11-16T12:00:00Z",
        "detailLevel": level,
        "team": {
            "name": "Antibes",
            "players": list(range(1, 9)),
            "roster": [
                {
                    "number": n,
                    "name": f"Player {n}",
                    "position": positions[n - 1],
                    "focus": n not in focus_off,
                }
                for n in range(1, 9)
            ],
        },
        "opponent": {"name": "Nice"},
        "startingLineup": {
            "oh1": 3,
            "oh2": 5,
            "mb1": 4,
            "mb2": 6,
            "setter": 1,
            "opposite": 7,
            "libero": 2,
        },
        "startingRotation": {"p1": 1, "p2": 3, "p3": 4, "p4": 7, "p5": 5, "p6": 6},
        "firstRally": {"antibesState": "service"},
        "format": {"setsToWin": 3, "setPoints": 25, "decidingSetPoints": 15},
        "currentSet": 1,
        "subs": [],
    }


def open_match(browser, level="advanced", focus_off=(4,), events=None, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    match = base_match(level, focus_off)
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events || []));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        {"match": match, "events": events or []},
    )
    page.reload()
    page.wait_for_timeout(200)
    return page, errors


def events(page):
    return page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1') || '[]')")


def wait_guard(page):
    page.wait_for_timeout(420)
