"""Normative Intermediate, Advanced, substitution and phase-banner acceptance tests."""
from helpers import events, open_match, wait_guard


def test_intermediate_focus_then_result_and_direct_team_entry(browser):
    page, errors = open_match(browser, "intermediate", focus_off=(4,))
    assert page.locator(".vlc-result-bar").count() == 2
    assert page.locator(".court-grid .nofocus").count() == 1

    focus = page.locator('.court-grid [data-zone="p2"]')  # player 3
    assert page.evaluate("e => getComputedStyle(e).backgroundImage", focus.element_handle()) == "none"
    focus.click()
    assert "selected" in focus.get_attribute("class")
    assert "Selected: #3" in page.inner_text('[data-vlc-actor="T"] small')
    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert (events(page)[-1]["player"], events(page)[-1]["action"], events(page)[-1]["result"]) == (3, "generic", "point")
    assert page.locator(".court-grid .selected").count() == 0

    wait_guard(page)
    page.click('[data-vlc-actor="T"] [data-vlc-result="error"]')
    assert (events(page)[-1]["player"], events(page)[-1]["result"]) == ("T", "error")
    wait_guard(page)
    page.click('[data-vlc-actor="A"] [data-vlc-result="error"]')
    assert (events(page)[-1]["player"], events(page)[-1]["winningTeam"]) == ("A", "team1")

    # A non-Focus cell is not individually selectable in normal capture.
    wait_guard(page)
    count = len(events(page))
    page.evaluate("document.querySelector('.court-grid .nofocus').click()")
    assert len(events(page)) == count and page.locator(".court-grid .selected").count() == 0

    # Substitution mode suspends rally capture.
    page.click("#subToggle")
    page.click('.court-grid [data-zone="p2"]')
    assert len(events(page)) == count
    assert not page.locator(".sub-sheet").is_hidden()
    page.click(".sub-cancel")
    assert not errors
    page.close()


def test_advanced_combined_grid_and_one_tap_team_opponent(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))
    page.click('.court-grid [data-zone="p2"]')  # player 3
    rows = page.locator("[data-adv-row]")
    assert rows.count() == 6
    assert rows.evaluate_all("els => els.map(e => e.getAttribute('data-adv-row'))") == [
        "attack", "block", "defense", "reception", "service", "set"
    ]
    for action in ("defense", "reception", "set"):
        row = page.locator(f'[data-adv-row="{action}"]')
        assert row.locator('[data-adv-result="point"]').count() == 0
        assert row.locator('[data-adv-unavailable="point"]').count() == 1
    for action in ("attack", "block", "service"):
        assert page.locator(f'[data-adv-row="{action}"] [data-adv-result="point"]').count() == 1
    assert page.locator('[data-adv-result="neutral"] svg').count() == 6

    page.click('[data-adv-row="reception"] [data-adv-result="neutral"]')
    event = events(page)[-1]
    assert (event["player"], event["action"], event["result"], event["winningTeam"]) == (3, "reception", "neutral", None)
    assert page.locator('[data-step="player"]').get_attribute("class").endswith("active")
    assert page.inner_text("#liveScore").replace("\n", "") == "0:0"

    wait_guard(page)
    assert not page.locator('[data-vlc-actor="T"]').is_hidden()  # player 4 has Focus disabled
    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert (events(page)[-1]["player"], events(page)[-1]["action"]) == ("T", "generic")
    wait_guard(page)
    page.click('[data-vlc-actor="A"] [data-vlc-result="error"]')
    assert (events(page)[-1]["player"], events(page)[-1]["pointOrigin"]) == ("A", "opponent_error")

    # Phase banner is informational and follows service after side-out.
    assert page.locator("#phaseBadge").evaluate("e => e.tagName") == "DIV"
    wait_guard(page)
    page.click('[data-vlc-actor="A"] [data-vlc-result="point"]')
    assert page.inner_text("#phaseBadge") == "RECEPTION"
    assert not errors
    page.close()
