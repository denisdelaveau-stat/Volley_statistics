"""Compact live header and blue player tray regression checks for v1.12."""
from helpers import events, open_match, wait_guard


def _score_values(page):
    return page.locator("#liveScore .digit-box").all_inner_texts()


def test_compact_header_sets_badges_without_service_indicator(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    assert _score_values(page) == ["0", "0"]
    page.click('[data-quick-result="point"]'); page.click('[data-quick-side="A"]')
    assert _score_values(page) == ["0", "1"]
    assert page.locator("#liveScore .service-line").first.is_hidden()
    wait_guard(page)
    page.click('[data-quick-result="error"]'); page.click('[data-quick-side="A"]')
    assert _score_values(page) == ["1", "1"]
    assert page.locator("#courtStatus").is_hidden() and page.locator("#phaseBadge").is_hidden()
    assert not errors
    page.close()


def test_bench_player_is_hidden_and_change_control_is_below_court(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    assert page.locator("#benchBtn").is_hidden()
    sub = page.locator("#subToggle").bounding_box()
    court = page.locator(".quick-player-tray").bounding_box()
    history = page.locator("#historyToggle").bounding_box()
    assert sub["height"] >= 52
    assert sub["y"] >= court["y"] + court["height"]
    assert sub["y"] + sub["height"] <= history["y"]
    assert page.inner_text("#subToggle") == "⟳ Changer de joueur"
    assert not errors
    page.close()
