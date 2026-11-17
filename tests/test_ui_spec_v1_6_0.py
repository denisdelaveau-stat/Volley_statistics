"""Normative Intermediate, Advanced, substitution and phase-banner acceptance tests."""
from helpers import events, open_match, wait_guard


def test_intermediate_focus_then_result_and_direct_team_entry(browser):
    page, errors = open_match(browser, "intermediate", focus_off=(4,))
    assert page.locator(".vlc-result-bar").count() == 2
    assert page.locator(".court-grid .nofocus").count() == 1

    # Modification 1: SUBSTITUTION is inside BENCH, immediately to the right
    # of the current libero / middle blocker replacement.
    bench_box = page.locator("#benchBtn").bounding_box()
    sub_box = page.locator("#subToggle").bounding_box()
    assert sub_box["x"] > bench_box["x"] + bench_box["width"]
    assert abs(sub_box["y"] - bench_box["y"]) < 2
    assert page.locator(".bench-row > #subToggle").count() == 1

    focus = page.locator('.court-grid [data-zone="p2"]')  # player 3
    assert page.evaluate("e => getComputedStyle(e).backgroundImage", focus.element_handle()) == "none"
    focus.click()
    assert "selected" in focus.get_attribute("class")

    # Modification 2: the selected player's number/name replace the team label,
    # while ADVERSE is visibly locked and cannot record a result.
    team_bar = page.locator('[data-vlc-actor="T"]')
    opponent_bar = page.locator('[data-vlc-actor="A"]')
    assert team_bar.locator(".vlc-result-label span").inner_text() == "3"
    assert team_bar.locator(".vlc-result-label small").inner_text() == "Player 3"
    assert "focus-selected" in team_bar.get_attribute("class")
    assert "focus-locked" in opponent_bar.get_attribute("class")
    assert opponent_bar.get_attribute("aria-disabled") == "true"
    assert opponent_bar.locator(".vlc-result-zone:disabled").count() == 2
    page.evaluate("""document.querySelector('[data-vlc-actor="A"] [data-vlc-result="point"]')
        .dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}))""")
    assert len(events(page)) == 0

    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert (events(page)[-1]["player"], events(page)[-1]["action"], events(page)[-1]["result"]) == (3, "generic", "point")
    assert page.locator(".court-grid .selected").count() == 0
    assert team_bar.locator(".vlc-result-label span").inner_text() == "Antibes"
    assert opponent_bar.get_attribute("aria-disabled") == "false"
    assert opponent_bar.locator(".vlc-result-zone:disabled").count() == 0

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
