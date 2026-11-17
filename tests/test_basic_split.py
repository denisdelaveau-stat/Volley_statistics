"""UI-BAS-01 and shared Basic acceptance checks for v1.6.2."""
from helpers import events, open_match, wait_guard


def test_basic_normative_result_bars(browser):
    page, errors = open_match(browser, "basic")
    assert page.inner_text("#appVersion") == "v1.6.2"
    assert page.locator(".vlc-result-bar").count() == 2
    assert page.inner_text("#phaseBadge") == "SERVICE"
    assert page.locator("#phaseBadge").evaluate("e => e.tagName") == "DIV"

    for actor in ("T", "A"):
        bar = page.locator(f'[data-vlc-actor="{actor}"]')
        error = bar.locator('[data-vlc-result="error"]')
        point = bar.locator('[data-vlc-result="point"]')
        assert error.inner_text() == "✕"
        assert point.inner_text() == "✓"
        eb, pb = error.bounding_box(), point.bounding_box()
        assert eb["x"] < pb["x"]
        assert eb["height"] >= 44 and pb["height"] >= 44
        assert page.evaluate("e => getComputedStyle(e).backgroundColor", error.element_handle()) == "rgb(220, 38, 38)"
        assert page.evaluate("e => getComputedStyle(e).backgroundColor", point.element_handle()) == "rgb(22, 163, 74)"

    cases = [
        ("T", "error", "T", "team2", "opponent_error"),
        ("T", "point", "T", "team1", "earned"),
        ("A", "error", "A", "team1", "opponent_error"),
        ("A", "point", "A", "team2", "earned"),
    ]
    for actor, result, player, winner, origin in cases:
        page.click(f'[data-vlc-actor="{actor}"] [data-vlc-result="{result}"]')
        event = events(page)[-1]
        assert (event["player"], event["result"], event["winningTeam"], event["pointOrigin"]) == (
            player,
            result,
            winner,
            origin,
        )
        wait_guard(page)

    assert page.inner_text("#phaseBadge") == "RECEPTION"  # last rally was won by Nice
    before = len(events(page))
    page.click("#captureUndo")
    assert len(events(page)) == before - 1
    assert not errors
    page.close()
