"""v1.6.5 compact live header and BENCH acceptance tests."""
from helpers import open_match, wait_guard


def _score_values(page):
    return page.locator("#liveScore .digit-box").all_inner_texts()


def test_compact_header_sets_badges_and_service_underline(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))

    assert page.locator("#captureTitle").is_hidden()
    assert page.locator("#setsLine").is_hidden()
    assert page.locator('[data-step="player"] > .step-title').is_hidden()
    assert _score_values(page) == ["0", "0"]
    assert page.locator("#liveScore .set-badge").all_inner_texts() == ["0", "0"]
    assert page.locator("#liveScore .side-a").get_attribute("class").endswith("serving")
    assert "serving" not in page.locator("#liveScore .side-b").get_attribute("class")

    # Opponent point creates a side-out: score and service underline both move right.
    page.click('[data-vlc-actor="A"] [data-vlc-result="point"]')
    assert _score_values(page) == ["0", "1"]
    assert "serving" not in page.locator("#liveScore .side-a").get_attribute("class")
    assert page.locator("#liveScore .side-b").get_attribute("class").endswith("serving")

    wait_guard(page)
    # Opponent Error awards the tracked team and moves service underline left.
    page.click('[data-vlc-actor="A"] [data-vlc-result="error"]')
    assert _score_values(page) == ["1", "1"]
    assert page.locator("#liveScore .side-a").get_attribute("class").endswith("serving")
    assert not errors
    page.close()


def test_bench_controls_are_smaller_and_centred(browser):
    page, errors = open_match(browser, "intermediate", focus_off=(4,))
    bench = page.locator("#benchBtn").bounding_box()
    sub = page.locator("#subToggle").bounding_box()
    row = page.locator(".bench-row").bounding_box()
    court = page.locator('.court-grid [data-zone="p2"]').bounding_box()

    assert 44 <= bench["height"] <= 46
    assert 44 <= sub["height"] <= 46
    assert bench["width"] <= 84
    assert sub["width"] <= 148
    assert sub["x"] > bench["x"] + bench["width"]
    pair_left = bench["x"]
    pair_right = sub["x"] + sub["width"]
    assert abs(((pair_left + pair_right) / 2) - (row["x"] + row["width"] / 2)) < 2
    assert not errors
    page.close()
