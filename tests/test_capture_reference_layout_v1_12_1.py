"""v1.14.0 action layout, orange court and History Delete acceptance tests."""
from __future__ import annotations

from helpers import events, open_match, wait_guard


def _box(page, selector):
    box = page.locator(selector).bounding_box()
    assert box is not None
    return box


def _same_row(a, b, tolerance=1):
    return abs(a["y"] - b["y"]) <= tolerance and abs(a["height"] - b["height"]) <= tolerance


def _close(a, b, tolerance=1):
    return abs(a - b) <= tolerance


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

    all_buttons = [set_box, defence, attack, block, serve, reception, positive, error, neutral, relance]
    assert max(box["width"] for box in all_buttons) - min(box["width"] for box in all_buttons) < 0.05
    assert max(box["height"] for box in all_buttons) - min(box["height"] for box in all_buttons) < 0.05

    assert _same_row(set_box, defence)
    assert set_box["x"] < defence["x"]
    assert _close((set_box["x"] + defence["x"] + defence["width"]) / 2, 195, 2)
    assert attack["x"] < positive["x"] < serve["x"]
    assert block["x"] < error["x"] < reception["x"]
    assert _close(attack["x"], block["x"])
    assert _close(serve["x"], reception["x"])
    assert _close(positive["x"], error["x"]) and _close(error["x"], neutral["x"])

    left_mid = (attack["y"] + block["y"] + block["height"]) / 2
    result_mid = (positive["y"] + neutral["y"] + neutral["height"]) / 2
    right_mid = (serve["y"] + reception["y"] + reception["height"]) / 2
    assert _close(left_mid, result_mid) and _close(result_mid, right_mid)
    assert relance["y"] > neutral["y"]
    assert _close(relance["x"], neutral["x"])

    player_tray = _box(page, ".quick-player-tray")
    action_entry = _box(page, ".quick-entry")
    assert player_tray["height"] > 200
    player_boxes = [_box(page, f'.court-grid [data-zone="{zone}"]') for zone in ("p4", "p3", "p2", "p5", "p6", "p1")]
    assert max(box["y"] for box in player_boxes[:3]) - min(box["y"] for box in player_boxes[:3]) <= 1
    assert max(box["y"] for box in player_boxes[3:]) - min(box["y"] for box in player_boxes[3:]) <= 1
    assert player_boxes[3]["y"] > player_boxes[0]["y"]
    assert page.locator(".quick-player-tray .court-net").count() == 0
    assert page.locator("#benchBtn").is_hidden()
    assert page.locator("#subToggle").inner_text() == "⟳ Changer de joueur"
    sub = _box(page, "#subToggle")
    history = _box(page, "#historyToggle")
    assert sub["y"] >= player_tray["y"] + player_tray["height"]
    assert sub["y"] + sub["height"] <= history["y"]
    assert page.locator(".quick-player-tray #subToggle").count() == 0

    assert page.locator("#captureUndo").count() == 0
    assert page.locator("#liveScore").is_visible()

    assert page.locator("#captureSaveJson").count() == 0
    assert page.locator("#captureReport").count() == 0
    assert page.locator("#reportBtn2").count() == 0
    assert page.get_by_text("SAVE .JSON", exact=True).count() == 0
    assert page.get_by_text("REPORT .HTML", exact=True).count() == 0

    assert "COACH VIEW" in page.locator("#homeCoach").inner_text()
    assert "ADVANCED STATISTICS" in page.locator("#homeStatistics").inner_text()
    assert page.locator("#appVersion").inner_text() == "v1.21.0"
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
