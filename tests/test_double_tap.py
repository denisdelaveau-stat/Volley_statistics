"""UI-GRD-01: 400 ms protection begins after an accepted result, not after player selection."""
from helpers import events, open_match


def rapid_double_click(page, selector):
    locator = page.locator(selector)
    box = locator.bounding_box()
    x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.click(x, y)
    page.mouse.click(x, y)


def test_result_guard_in_all_modes(browser):
    # Basic: double-tapping one visible result zone records one rally.
    page, errors = open_match(browser, "basic")
    rapid_double_click(page, '[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert len(events(page)) == 1
    assert page.evaluate("window.VLC_TAPS_BLOCKED") >= 1
    page.wait_for_timeout(420)
    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert len(events(page)) == 2
    assert not errors
    page.close()

    # Intermediate: player selection and the following result may be faster than 400 ms.
    page, errors = open_match(browser, "intermediate")
    page.click('.court-grid [data-zone="p2"]')
    rapid_double_click(page, '[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert len(events(page)) == 1
    assert events(page)[0]["player"] == 3
    assert not errors
    page.close()

    # Advanced: the second tap (combined action/result) is not blocked by the first player tap.
    page, errors = open_match(browser, "advanced")
    page.click('.court-grid [data-zone="p2"]')
    rapid_double_click(page, '[data-adv-row="attack"] [data-adv-result="point"]')
    assert len(events(page)) == 1
    assert (events(page)[0]["action"], events(page)[0]["result"]) == ("attack", "point")
    # Navigation/statistics is outside the result guard.
    page.click("#statsToggle")
    assert page.get_attribute("#statsToggle", "aria-expanded") == "true"
    assert not errors
    page.close()
