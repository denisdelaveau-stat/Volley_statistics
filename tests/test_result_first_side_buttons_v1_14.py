"""v1.14.0 fixed HOME/ERROR/AWAY geometry, reset, keyboard and touch acceptance."""
from __future__ import annotations

from helpers import APP_URI, base_match, events, open_match, wait_guard


def _box(page, selector):
    box = page.locator(selector).bounding_box()
    assert box is not None
    return {k: round(v, 2) for k, v in box.items()}


def _input_geometry(page):
    selectors = [
        '[data-quick-action="set"]', '[data-quick-action="defense"]',
        '[data-quick-action="attack"]', '[data-quick-action="block"]',
        '[data-quick-action="service"]', '[data-quick-action="reception"]',
        '[data-quick-action="freeball"]', '[data-quick-result="point"]',
        '[data-quick-result="error"]', '[data-quick-result="neutral"]',
    ]
    return {selector: _box(page, selector) for selector in selectors}


def _assert_hidden_and_reset(page):
    for side in ("T", "A"):
        button = page.locator(f'[data-quick-side="{side}"]')
        assert button.is_hidden()
        assert button.get_attribute("aria-hidden") == "true"
        assert button.get_attribute("tabindex") == "-1"
    assert page.evaluate("window.VLCQuickCapture.getState()") == {
        "actor": None, "action": None, "pendingResult": None, "guarded": page.evaluate("window.VLCQuickCapture.getState().guarded")
    }


def test_home_error_away_axis_equal_dimensions_and_zero_grid_shift_390(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    before = _input_geometry(page)
    assert page.locator('[data-quick-side="T"]').is_hidden()
    assert page.locator('[data-quick-side="A"]').is_hidden()

    page.click('[data-quick-result="point"]')
    after = _input_geometry(page)
    assert before == after

    home = _box(page, '[data-quick-side="T"]')
    error = _box(page, '[data-quick-result="error"]')
    away = _box(page, '[data-quick-side="A"]')
    result_boxes = [_box(page, f'[data-quick-result="{result}"]') for result in ("point", "error", "neutral")]
    assert home["x"] < error["x"] < away["x"]
    assert home["y"] == error["y"] == away["y"]
    assert home["height"] == error["height"] == away["height"]
    assert max(home["width"], error["width"], away["width"]) - min(home["width"], error["width"], away["width"]) < 0.05
    for box in result_boxes:
        assert abs(box["width"] - error["width"]) < 0.05
        assert box["height"] == error["height"]
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert not errors
    page.close()


def test_result_first_point_error_neutral_commit_and_clean_reset(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    cases = [("point", "T", "team1"), ("error", "A", "team1"), ("neutral", "T", None)]
    for result, side, winner in cases:
        page.click(f'[data-quick-result="{result}"]')
        assert page.locator('[data-quick-side="T"]').is_visible()
        assert page.locator('[data-quick-side="A"]').is_visible()
        page.click(f'[data-quick-side="{side}"]')
        event = events(page)[-1]
        assert (event["result"], event["player"], event["winningTeam"]) == (result, side, winner)
        assert page.locator('[data-quick-side="T"]').is_hidden()
        assert page.locator('[data-quick-side="A"]').is_hidden()
        state = page.evaluate("window.VLCQuickCapture.getState()")
        assert state["actor"] is None and state["action"] is None and state["pendingResult"] is None
        wait_guard(page)
    assert not errors
    page.close()


def test_result_first_cancellation_toggle_and_escape(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    baseline = _input_geometry(page)
    page.click('[data-quick-result="error"]')
    assert page.locator('[data-quick-side="T"]').is_visible()
    page.click('[data-quick-result="error"]')
    assert len(events(page)) == 0
    assert page.locator('[data-quick-side="T"]').is_hidden()
    assert _input_geometry(page) == baseline

    page.click('[data-quick-result="neutral"]')
    page.keyboard.press("Escape")
    assert len(events(page)) == 0
    assert page.locator('[data-quick-side="T"]').is_hidden()
    assert page.locator('[data-quick-side="A"]').is_hidden()
    assert _input_geometry(page) == baseline
    assert not errors
    page.close()


def test_result_first_keyboard_and_touch_accessibility_390(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    result = page.locator('[data-quick-result="point"]')
    result.focus(); page.keyboard.press("Enter")
    home = page.locator('[data-quick-side="T"]')
    away = page.locator('[data-quick-side="A"]')
    assert home.is_visible() and away.is_visible()
    assert result.get_attribute("aria-expanded") == "true"
    assert home.get_attribute("aria-hidden") == "false" and home.get_attribute("tabindex") == "0"
    home.focus(); page.keyboard.press("Enter")
    assert len(events(page)) == 1 and events(page)[0]["player"] == "T"
    assert home.is_hidden() and away.is_hidden()
    assert not errors
    page.close()

    context = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
    touch_page = context.new_page()
    touch_errors = []
    touch_page.on("pageerror", lambda error: touch_errors.append(str(error)))
    touch_page.goto(APP_URI)
    touch_page.evaluate(
        """match => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(match));
          localStorage.setItem('volleyCapture.events.v1', '[]');
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        base_match("advanced", focus_off=()),
    )
    touch_page.reload(); touch_page.wait_for_timeout(120)
    touch_page.locator('[data-quick-result="neutral"]').tap()
    touch_home = touch_page.locator('[data-quick-side="T"]')
    assert touch_home.is_visible() and _box(touch_page, '[data-quick-side="T"]')["height"] >= 48
    touch_home.tap()
    stored = touch_page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1'))")
    assert len(stored) == 1 and stored[0]["result"] == "neutral" and stored[0]["player"] == "T"
    assert touch_home.is_hidden() and not touch_errors
    context.close()
