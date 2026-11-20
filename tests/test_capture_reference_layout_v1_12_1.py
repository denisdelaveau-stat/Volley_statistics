"""v1.12.2 reference action layout and compact player tray acceptance tests."""
from __future__ import annotations

from helpers import events, open_match, wait_guard


def _box(page, selector):
    box = page.locator(selector).bounding_box()
    assert box is not None
    return box


def _same_row(a, b, tolerance=1):
    return abs(a["y"] - b["y"]) <= tolerance and abs(a["height"] - b["height"]) <= tolerance


def test_reference_action_geometry_compact_players_and_removed_exports(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})

    expected = {
        '[data-quick-action="set"]': "SET",
        '[data-quick-action="defense"]': "DEFENCE",
        '[data-quick-action="attack"]': "ATTACK",
        '[data-quick-action="block"]': "BLOCK",
        '[data-quick-action="service"]': "SERVE",
        '[data-quick-action="reception"]': "RECEPTION",
        '[data-quick-result="point"]': "□\nPOSITIF",
        '[data-quick-result="error"]': "×\nERREUR",
        '[data-quick-result="neutral"]': "○\nNEUTRE",
        '[data-quick-action="freeball"]': "RELANCE",
    }
    for selector, text in expected.items():
        assert page.locator(selector).inner_text() == text

    set_box = _box(page, '[data-quick-action="set"]')
    defence = _box(page, '[data-quick-action="defense"]')
    attack = _box(page, '[data-quick-action="attack"]')
    block = _box(page, '[data-quick-action="block"]')
    serve = _box(page, '[data-quick-action="service"]')
    reception = _box(page, '[data-quick-action="reception"]')
    positive = _box(page, '[data-quick-result="point"]')
    error = _box(page, '[data-quick-result="error"]')
    neutral = _box(page, '[data-quick-result="neutral"]')
    relance = _box(page, '[data-quick-action="freeball"]')

    assert _same_row(set_box, defence)
    assert set_box["x"] < defence["x"]
    assert _same_row(attack, positive) and _same_row(positive, serve)
    assert _same_row(block, error) and _same_row(error, reception)
    assert attack["x"] < positive["x"] < serve["x"]
    assert block["x"] < error["x"] < reception["x"]
    assert positive["x"] == error["x"] == neutral["x"]
    assert positive["width"] == error["width"] == neutral["width"]
    assert relance["y"] > neutral["y"]
    assert relance["x"] < neutral["x"]
    assert relance["x"] + relance["width"] > neutral["x"] + neutral["width"]

    player_tray = _box(page, ".quick-player-tray")
    action_entry = _box(page, ".quick-entry")
    assert player_tray["height"] < 120
    assert player_tray["height"] < action_entry["height"] / 2
    player_boxes = [_box(page, f'.court-grid [data-zone="{zone}"]') for zone in ("p4", "p3", "p2", "p5", "p6", "p1")]
    assert max(box["y"] for box in player_boxes) - min(box["y"] for box in player_boxes) <= 1

    assert page.locator("#captureSaveJson").count() == 0
    assert page.locator("#captureReport").count() == 0
    assert page.locator("#reportBtn2").count() == 0
    assert page.get_by_text("SAVE .JSON", exact=True).count() == 0
    assert page.get_by_text("REPORT .HTML", exact=True).count() == 0

    assert "COACH VIEW" in page.locator("#homeCoach").inner_text()
    assert "ADVANCED STATISTICS" in page.locator("#homeStatistics").inner_text()
    assert page.locator("#appVersion").inner_text() == "v1.12.2"
    assert not errors
    page.close()


def test_relance_keeps_freeball_event_semantics(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    page.click('.court-grid [data-zone="p4"]')
    page.click('[data-quick-action="freeball"]')
    page.click('[data-quick-result="neutral"]')
    wait_guard(page)
    recorded = events(page)[-1]
    assert recorded["action"] == "freeball"
    assert recorded["result"] == "neutral"
    assert not errors
    page.close()
