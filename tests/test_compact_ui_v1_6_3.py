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


def test_bench_controls_are_compact_and_centred(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    bench = page.locator("#benchBtn").bounding_box(); sub = page.locator("#subToggle").bounding_box(); row = page.locator(".bench-row").bounding_box()
    assert 35 <= bench["height"] <= 40 and 36 <= sub["height"] <= 42
    assert sub["x"] > bench["x"] + bench["width"]
    assert row["x"] <= bench["x"] and sub["x"] + sub["width"] <= row["x"] + row["width"]
    assert "SUBSTITUTE" in page.inner_text("#subToggle")
    assert not errors
    page.close()
