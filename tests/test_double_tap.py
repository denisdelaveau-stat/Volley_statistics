"""v1.12: the 450 ms result guard begins only after an accepted result."""
from helpers import events, open_match


def rapid_double_click(page, selector):
    locator=page.locator(selector); box=locator.bounding_box(); x=box["x"]+box["width"]/2; y=box["y"]+box["height"]/2
    page.mouse.click(x,y); page.mouse.click(x,y)


def test_result_guard_in_all_three_input_paths(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    page.click('[data-quick-result="point"]')
    rapid_double_click(page, '[data-quick-side="T"]')
    assert len(events(page)) == 1
    assert page.evaluate("window.VLCQuickCapture.commit('point')") is False
    assert page.evaluate("window.VLC_TAPS_BLOCKED") >= 1
    page.wait_for_timeout(470)
    page.click('.court-grid [data-zone="p2"]')
    rapid_double_click(page, '[data-quick-result="neutral"]')
    assert len(events(page)) == 2 and events(page)[-1]["action"] == "generic"
    page.wait_for_timeout(470)
    page.click('.court-grid [data-zone="p2"]'); page.click('[data-quick-action="attack"]')
    rapid_double_click(page, '[data-quick-result="point"]')
    assert len(events(page)) == 3 and (events(page)[-1]["action"],events(page)[-1]["result"]) == ("attack","point")
    assert page.locator("#statsToggle").is_hidden()
    assert not errors
    page.close()
