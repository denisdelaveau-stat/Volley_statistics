"""LIVE COURT / PLAYER FOCUS v1.13.0 acceptance tests."""
from __future__ import annotations

import copy
import json
from pathlib import Path

from helpers import APP_URI, base_match

ROOT = Path(__file__).resolve().parents[1]
V2_FIXTURE = json.loads((ROOT / "statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json").read_text())
V1_REFERENCE = json.loads((ROOT / "tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json").read_text())


def _open_with_raw(browser, raw, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 1280, "height": 800})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate(
        """raw => {
          localStorage.clear(); sessionStorage.clear();
          sessionStorage.setItem('volleyAnalysis.replay.v1', JSON.stringify(raw));
          sessionStorage.setItem('volleyAnalysis.replay.source.v1', 'acceptance.json');
        }""",
        raw,
    )
    page.reload()
    page.evaluate("window.VolleyCoach.open()")
    page.locator('[data-coach-tab="live-court"]').click()
    return page, errors


def _status_match():
    match = base_match("advanced", focus_off=())
    match["currentSet"] = 1
    events = []
    score_a = score_b = 0

    def add(player, results):
        nonlocal score_a, score_b
        for result in results:
            if result == "point":
                score_a += 1
                winner = "team1"
            elif result == "error":
                score_b += 1
                winner = "team2"
            else:
                winner = None
            events.append(
                {
                    "id": len(events) + 1,
                    "set": 1,
                    "player": player,
                    "action": "attack",
                    "result": result,
                    "winningTeam": winner,
                    "scoreA": score_a,
                    "scoreB": score_b,
                }
            )
            if winner is None:
                score_a += 1
                events.append(
                    {
                        "id": len(events) + 1,
                        "set": 1,
                        "player": "A",
                        "action": "adverse",
                        "result": "error",
                        "winningTeam": "team1",
                        "scoreA": score_a,
                        "scoreB": score_b,
                    }
                )

    add(3, ["point", "point", "neutral", "point", "point", "point"])
    add(5, ["point", "neutral", "point", "error", "error"])
    add(7, ["point", "neutral", "point", "error", "error", "error"])
    return {"format": "volley-live-capture", "version": 1, "match": match, "events": events}


def test_live_court_focus_navigation_and_landscape_layout(browser):
    fixture = copy.deepcopy(V2_FIXTURE)
    fixture["match"]["currentSetNumber"] = 1
    page, errors = _open_with_raw(browser, fixture)

    assert page.locator(".live-court-view").is_visible()
    assert page.locator(".live-player-card").count() == 6
    assert page.locator(".live-position").all_inner_texts() == ["4", "3", "2", "5", "6", "1"]
    assert page.locator(".live-rally").count() == 12
    assert page.locator(".live-rally.now em").inner_text() == "Now"

    target = page.locator('[data-live-player="15"]')
    assert target.count() == 1
    target.click()
    assert page.locator(".player-focus-view").is_visible()
    assert page.locator('[data-coach-tab="player-focus"]').get_attribute("aria-selected") == "true"
    before = page.locator(".focus-navigation strong").inner_text()
    page.locator("[data-focus-next]").click()
    after = page.locator(".focus-navigation strong").inner_text()
    assert before != after
    page.locator("[data-focus-prev]").click()
    assert page.locator(".focus-navigation strong").inner_text() == before
    page.locator("[data-focus-court]").click()
    assert page.locator(".live-court-view").is_visible()

    dimensions = page.evaluate("({w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight})")
    assert dimensions["w"] == 1280 and dimensions["h"] == 800
    assert dimensions["sw"] <= 1280 and dimensions["sh"] <= 800
    assert not errors
    page.close()


def test_good_watch_difficulty_and_alert_strips(browser):
    page, errors = _open_with_raw(browser, _status_match())
    assert "status-good" in (page.locator('[data-live-player="3"]').get_attribute("class") or "")
    assert "status-watch" in (page.locator('[data-live-player="5"]').get_attribute("class") or "")
    assert "status-difficulty" in (page.locator('[data-live-player="7"]').get_attribute("class") or "")
    assert page.locator('[data-live-player="3"] .live-alert-strip').count() == 0
    assert "Attack efficiency" in page.locator('[data-live-player="5"] .live-alert-strip').inner_text()
    assert "3 errors in a row" in page.locator('[data-live-player="7"] .live-alert-strip').inner_text()
    assert not errors
    page.close()


def test_empty_landscape_is_neutral_zero_or_na(browser):
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    page.evaluate("window.VolleyCoach.open()")
    page.locator('[data-coach-tab="live-court"]').click()

    assert page.locator(".live-player-card.status-neutral").count() == 6
    assert page.locator(".live-player-card.status-watch,.live-player-card.status-difficulty").count() == 0
    assert set(page.locator(".live-number").all_inner_texts()) == {"NA"}
    assert "0" in page.locator(".live-scoreboard").inner_text()
    assert "NA" in page.locator(".live-header-badge").inner_text()

    page.locator(".live-mode-pill").click()
    page.locator('[data-coach-tab="players"]').click()
    page.locator("[data-empty-detail]").click()
    assert page.locator(".player-focus-view").is_visible()
    assert page.locator(".focus-skill-panel").count() == 4
    assert page.locator(".focus-player-card.status-neutral").count() == 1
    assert page.locator(".focus-player-card.status-watch,.focus-player-card.status-difficulty").count() == 0
    assert page.locator(".focus-curve-na").count() == 4
    assert not errors
    page.close()


def test_v2_fixture_derived_pos_good_trend_last_five_and_curves(browser):
    fixture = copy.deepcopy(V2_FIXTURE)
    fixture["match"]["currentSetNumber"] = 1
    page, errors = _open_with_raw(browser, fixture)
    page.locator('[data-live-player="15"]').click()

    reception = page.locator(".focus-reception")
    defense = page.locator(".focus-defense")
    attack = page.locator(".focus-attack")
    assert "POS\n≈0" in reception.locator(".focus-stat-grid").inner_text()
    assert "GOOD\n≈7" in defense.locator(".focus-stat-grid").inner_text()
    assert reception.locator(".focus-skill-summary > strong").inner_text() == "≈0%"
    assert defense.locator(".focus-skill-summary > strong").inner_text() == "≈100%"
    assert attack.locator(".focus-eff-trend").inner_text() == "↑"
    assert "derniers" in (attack.locator(".focus-eff-trend").get_attribute("title") or "")

    last_five = attack.locator(".focus-last-five span")
    assert last_five.count() == 5
    assert last_five.all_inner_texts() == ["−", "✓", "−", "✓", "−"]
    assert page.locator("svg.focus-curve").count() == 4
    assert page.locator("svg.focus-curve path.area").count() == 4
    assert page.locator("svg.focus-curve circle.last").count() == 4
    assert "BLK\nNA" in attack.locator(".focus-stat-grid").inner_text()
    assert not errors
    page.close()


def test_capture_v1_without_intermediate_contacts_uses_na_curves(browser):
    page, errors = _open_with_raw(browser, V1_REFERENCE)
    page.locator(".live-player-card").filter(has_text="HUGO").click() if page.locator(".live-player-card").filter(has_text="HUGO").count() else page.locator(".live-player-card").first.click()
    assert page.locator("svg.focus-curve").count() == 0
    assert page.locator(".focus-curve-na").count() == 4
    assert "Contacts intermédiaires absents" in page.locator(".focus-curve-na").first.inner_text()
    assert "BLK\nNA" in page.locator(".focus-attack .focus-stat-grid").inner_text()
    assert not errors
    page.close()


def test_live_court_requests_rotation_in_portrait(browser):
    page, errors = _open_with_raw(browser, V2_FIXTURE, viewport={"width": 390, "height": 844})
    assert page.locator(".live-landscape-gate").is_visible()
    assert "Tournez l’appareil" in page.locator(".live-landscape-gate").inner_text()
    assert not errors
    page.close()
