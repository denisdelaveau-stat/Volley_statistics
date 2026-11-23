"""v1.20.0 SPECTATOR VIEW Ranking and simplified Advanced Statistics acceptance."""
from __future__ import annotations

import copy
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

from helpers import APP_URI
from test_spectator_timeline_v1_15 import V2_FIXTURE, archive_v2, open_spectator

ROOT = Path(__file__).resolve().parents[1]


def ranking_fixture():
    data = archive_v2([
        (0, 1, "HOME", "AWAY"),
        (0, 2, "HOME", "HOME"),
        (1, 2, "AWAY", "HOME"),
        (1, 3, "HOME", "AWAY"),
    ])
    data["players"] = [
        {"playerId": "p12", "teamId": "home", "number": 12, "name": "Sam", "role": "OH"},
        {"playerId": "p7", "teamId": "home", "number": 7, "name": "Alex", "role": "OPP"},
        {"playerId": "p8", "teamId": "home", "number": 8, "name": "Blair", "role": "MB"},
        {"playerId": "p99", "teamId": "away", "number": 99, "name": "Opponent", "role": "OH"},
    ]
    # Keep the rally timeline valid while excluding its terminal actions from Ranking.
    for event in data["events"]:
        event["actionType"] = "SET"
        event["playerId"] = "p12"
    extras = [
        ("x1", "r1", "p7", "ATTACK", "POINT"),
        ("x2", "r2", "p7", "ATTACK", "POINT"),
        ("x3", "r3", "p8", "ATTACK", "POINT"),
        ("x4", "r4", "p8", "ATTACK", "ERROR"),
        ("x5", "r1", "p8", "BLOCK", "POINT"),
        ("x6", "r2", "p8", "DEFENCE", "CONTINUE"),
        ("x7", "r3", "p7", "RECEPTION", "CONTINUE"),
        ("x8", "r4", "p7", "SERVICE", "ERROR"),
        ("x9", "r4", "p7", "SERVICE", "ERROR"),
        ("x10", "r4", "p99", "ATTACK", "POINT"),
    ]
    for order, (event_id, rally_id, player_id, action, result) in enumerate(extras, 20):
        data["events"].append(
            {
                "eventId": event_id,
                "eventType": "ACTION",
                "rallyId": rally_id,
                "setNumber": 1,
                "sequenceNumber": order,
                "actionOrder": order,
                "teamId": "away" if player_id == "p99" else "home",
                "playerId": player_id,
                "actionType": action,
                "evaluation": result,
                "status": "ACTIVE",
            }
        )
    return data


def test_archive_tabs_are_renamed_and_ranking_is_available(browser):
    page, errors = open_spectator(browser, ranking_fixture())
    labels = page.locator(".spectator-nav [data-tab]").all_inner_texts()
    assert labels == ["SCORES", "TIMELINE", "GRAPH", "RANKING"]
    assert page.locator('[data-tab="live-timeline"]').get_attribute("aria-selected") == "true"
    page.locator('[data-tab="ranking"]').click()
    assert page.locator('[data-panel="ranking"]').is_visible()
    assert page.locator("#rankingView option").all_inner_texts() == ["Highlight", "Lowlight", "Delta"]
    assert page.locator("#rankingCategory option").all_inner_texts() == ["All", "Attack", "Block", "Defence", "Reception", "Service"]
    assert page.locator(".ranking-card").count() == 5
    assert not errors
    page.close()


def test_ranking_filters_and_values_are_derived_from_official_json(browser):
    page, errors = open_spectator(browser, ranking_fixture())
    page.locator('[data-tab="ranking"]').click()
    page.locator("#rankingCategory").select_option("attack")

    rows = page.locator(".ranking-row")
    assert rows.count() == 2
    assert rows.nth(0).locator(".ranking-player b").inner_text() == "Alex"
    assert rows.nth(0).locator(".ranking-value b").inner_text() == "2"
    assert rows.nth(1).locator(".ranking-player b").inner_text() == "Blair"
    assert rows.nth(1).locator(".ranking-value b").inner_text() == "1"
    assert "Opponent" not in page.locator("#rankingCards").inner_text()

    page.locator("#rankingView").select_option("lowlight")
    assert rows.nth(0).locator(".ranking-player b").inner_text() == "Blair"
    assert rows.nth(0).locator(".ranking-value b").inner_text() == "1"

    page.locator("#rankingView").select_option("delta")
    assert page.locator("#rankingModeTitle").inner_text() == "Delta"
    assert rows.nth(0).locator(".ranking-player b").inner_text() == "Alex"
    assert rows.nth(0).locator(".ranking-value b").inner_text() == "2"
    assert rows.nth(1).locator(".ranking-value b").inner_text() == "0"

    page.locator("#rankingCategory").select_option("service")
    page.locator("#rankingView").select_option("lowlight")
    assert page.locator(".ranking-row").count() == 1
    assert page.locator(".ranking-player b").inner_text() == "Alex"
    assert page.locator(".ranking-value b").inner_text() == "2"
    assert not errors
    page.close()


def test_ranking_empty_state_is_gray_zero_na_and_has_no_demo_values(browser):
    page, errors = open_spectator(browser, archive_v2([]), {"width": 390, "height": 844})
    page.locator('[data-tab="ranking"]').click()
    assert page.locator(".ranking-card.empty-ranking").count() == 5
    assert page.locator(".ranking-empty strong").all_inner_texts() == ["NA"] * 5
    assert page.locator(".ranking-empty span").all_inner_texts() == ["0"] * 5
    assert page.locator("#rankingSummary").inner_text() == "0 joueur · 0 action"
    color = page.locator(".ranking-empty strong").first.evaluate("e => getComputedStyle(e).color")
    assert color == "rgb(154, 167, 182)"
    assert not errors
    page.close()


def open_advanced(browser, viewport):
    page = browser.new_page(viewport=viewport)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI.replace("index.html", "statistics/index.html"))
    page.evaluate(
        """payload => {
          localStorage.clear(); sessionStorage.clear();
          sessionStorage.setItem('volleyAnalysis.replay.v1', JSON.stringify(payload));
          sessionStorage.setItem('volleyAnalysis.replay.source.v1', 'official-fixture.json');
        }""",
        json.loads(V2_FIXTURE.read_text()),
    )
    page.reload()
    page.wait_for_selector("#statsLoader", state="hidden")
    return page, errors


def test_advanced_statistics_keeps_only_complete_coach_aligned_timeline(browser):
    page, errors = open_advanced(browser, {"width": 1536, "height": 1024})
    assert page.locator(".coach-stats-header").is_visible()
    assert page.locator(".timeline-panel").is_visible()
    assert page.locator("#view .vertical-table").is_visible()
    assert page.locator(".vertical-table .player-head.player-number").count() >= 6
    assert page.locator(".vertical-table .action-cell .act").count() > 0
    first_action = page.locator(".vertical-table .action-cell:has(.act)").first
    assert "score" in first_action.get_attribute("aria-label").lower()
    assert "rally" in first_action.get_attribute("aria-label").lower()
    assert page.locator("#playerStats,.stats-panel,.stat-detail,.metricbar,.legend,.note").count() == 0
    assert page.locator("#rotationMetricsBtn,#playingTimeBtn,#rosterRankingBtn").count() == 0
    assert page.locator("#rotationPage,#playingPage,#rosterPage").count() == 0
    assert page.locator(".mini-chart,.mini-pie,.efficiency-curves,.curve-card,.chart-modal").count() == 0
    assert page.locator("body").evaluate("e => getComputedStyle(e).backgroundImage") != "none"
    assert "VOLLEYLIVE" in page.locator(".coach-stats-brand").inner_text()
    assert not errors
    page.close()


def test_v1_20_visual_baselines_for_ranking_and_advanced(browser, tmp_path):
    ranking_viewports = {
        "phone_390x844": {"width": 390, "height": 844},
        "tablet_768x1024": {"width": 768, "height": 1024},
        "desktop_1536x1024": {"width": 1536, "height": 1024},
    }
    for name, viewport in ranking_viewports.items():
        page, errors = open_spectator(browser, ranking_fixture(), viewport)
        page.locator('[data-tab="ranking"]').click()
        page.wait_for_timeout(250)
        actual = tmp_path / f"ranking_{name}.png"
        page.screenshot(path=str(actual), full_page=True)
        baseline = ROOT / "tests" / "visual_baselines" / f"ranking_{name}_v1_20_0.png"
        assert baseline.exists(), f"Missing {baseline.name}"
        observed, expected = Image.open(actual).convert("RGB"), Image.open(baseline).convert("RGB")
        assert observed.size == expected.size
        assert max(ImageStat.Stat(ImageChops.difference(expected, observed)).mean) < 3.0
        assert not errors
        page.close()

    for name, viewport in {
        "phone_390x844": {"width": 390, "height": 844},
        "desktop_1536x1024": {"width": 1536, "height": 1024},
    }.items():
        page, errors = open_advanced(browser, viewport)
        page.wait_for_timeout(250)
        actual = tmp_path / f"advanced_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / "tests" / "visual_baselines" / f"advanced_{name}_v1_22_0.png"
        assert baseline.exists(), f"Missing {baseline.name}"
        observed, expected = Image.open(actual).convert("RGB"), Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        assert max(ImageStat.Stat(ImageChops.difference(expected, observed)).mean) < 3.0
        assert not errors
        page.close()
