"""HTML escaping: names and other free text from saved or imported matches must never run as markup.

Every free-text field of the reference fixtures (team, opponent, player, match and file names) is replaced with an
HTML payload that would call ``window.__xss()`` if it were parsed. Each screen is then rendered and the test checks
that no payload ran and that the payloads are displayed as escaped text (so the screens did render the data).
"""
from __future__ import annotations

import copy
import json
import re

from helpers import APP_URI, ROOT

SPECTATOR_URI = (ROOT / "spectator.html").as_uri()
CAPTURE_V1 = json.loads((ROOT / "tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json").read_text(encoding="utf-8"))
UNIFIED_V2 = json.loads(
    (ROOT / "statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json").read_text(encoding="utf-8")
)
FREE_TEXT = re.compile(
    r"^(name|title|label|team|opponent|teamName|opponentName|homeName|awayName|shortName|displayName|playerName"
    r"|sourceName|notes?|comment|venue|competition|location|description|club|city|fileName)$",
    re.I,
)
ESCAPED_PAYLOAD = "&lt;img src=x onerror=__xss"
TRAP = "window.__xssHits = []; window.__xss = function (i) { window.__xssHits.push(i); };"


def poisoned(document):
    """Deep copy of ``document`` with every free-text string turned into a numbered HTML payload."""
    doc = copy.deepcopy(document)
    counter = [0]

    def walk(node):
        if isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for key, value in node.items():
                if isinstance(value, str) and FREE_TEXT.match(key):
                    counter[0] += 1
                    node[key] = f"{value}x\"'><img src=x onerror=__xss({counter[0]})>"
                else:
                    walk(value)

    walk(doc)
    return doc


def open_page(browser, uri, storage, stage=None):
    """Opens ``uri`` with ``storage`` in localStorage; ``stage='capture'`` skips the Home screen like a reload."""
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.dismiss())
    page.add_init_script(TRAP)
    page.goto(uri)
    page.evaluate(
        """([storage, stage]) => {
          localStorage.clear();
          sessionStorage.clear();
          Object.entries(storage).forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value)));
          if (stage) sessionStorage.setItem('volleyCapture.stage', stage);
        }""",
        [storage, stage],
    )
    page.reload()
    page.wait_for_timeout(300)
    return page, errors


def hits(page):
    return page.evaluate("window.__xssHits")


def escaped_count(page):
    return page.evaluate(f"document.body.innerHTML.split({json.dumps(ESCAPED_PAYLOAD)}).length - 1")


def click_if_present(page, selector):
    """Clicks the first visible match of ``selector``; some controls are hidden depending on layout and data."""
    locator = page.locator(selector)
    for index in range(locator.count()):
        if locator.nth(index).is_visible():
            locator.nth(index).click()
            page.wait_for_timeout(120)
            return


def test_capture_screen_escapes_names(browser):
    capture = poisoned(CAPTURE_V1)
    page, errors = open_page(
        browser,
        APP_URI,
        {"volleyCapture.match.v1": capture["match"], "volleyCapture.events.v1": capture.get("events", [])},
        stage="capture",
    )
    click_if_present(page, '#capturePanel [data-player]:not([data-player="A"])')
    click_if_present(page, "#historyToggle")
    click_if_present(page, "#statsToggle")
    assert hits(page) == []
    assert escaped_count(page) > 0
    assert not errors
    page.close()


def test_coach_view_escapes_names(browser):
    capture = poisoned(CAPTURE_V1)
    page, errors = open_page(
        browser,
        APP_URI,
        {"volleyCapture.match.v1": capture["match"], "volleyCapture.events.v1": capture.get("events", [])},
        stage="capture",
    )
    page.evaluate("VolleyCoach.open()")
    for tab in ("overview", "rotations", "players", "live-court", "player-focus"):
        click_if_present(page, f'[data-coach-tab="{tab}"]')
        assert hits(page) == [], tab
    click_if_present(page, '[data-coach-tab="players"]')
    click_if_present(page, '[data-player-scope="all"]')
    click_if_present(page, "#coachContent [data-player]")
    assert hits(page) == []
    assert escaped_count(page) > 0
    assert not errors
    page.close()


def test_match_library_escapes_imported_names(browser):
    history = [
        {"id": "h1", "raw": poisoned(CAPTURE_V1), "sourceName": "import.json", "sourceType": "import",
         "savedAt": "2026-11-15T12:00:00.000Z"},
        {"id": "h2", "raw": poisoned(UNIFIED_V2), "sourceName": "import.json", "sourceType": "import",
         "savedAt": "2026-11-15T13:00:00.000Z"},
    ]
    page, errors = open_page(browser, APP_URI, {"volleyMatchHub.history.v1": history})
    page.evaluate("VolleyMatchLibrary.openLibrary('all')")
    page.wait_for_timeout(200)
    assert hits(page) == []
    assert escaped_count(page) > 0
    assert not errors
    page.close()


def test_spectator_view_escapes_names(browser):
    for document in (poisoned(UNIFIED_V2), poisoned(CAPTURE_V1)):
        page, errors = open_page(browser, SPECTATOR_URI, {"volleySpectator.archive.v1": document})
        for tab in ("live-score", "live-timeline", "live-graph", "ranking"):
            click_if_present(page, f'[data-tab="{tab}"]')
            assert hits(page) == [], tab
        assert escaped_count(page) > 0
        assert not errors
        page.close()
