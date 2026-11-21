"""v1.12 result-first HOME/AWAY capture acceptance."""
from helpers import events, open_match, wait_guard


def test_basic_normative_result_bars(browser):
    page, errors = open_match(browser, "basic")
    assert page.inner_text("#appVersion") == "v1.13.0"
    assert page.locator(".quick-side-selector").is_hidden()
    assert page.locator("[data-quick-side]").all_inner_texts() == ["HOME", "AWAY"]
    assert page.locator("[data-quick-result]").count() == 3
    cases = [
        ("T", "error", "T", "team2", "opponent_error"),
        ("T", "point", "T", "team1", "earned"),
        ("A", "error", "A", "team1", "opponent_error"),
        ("A", "point", "A", "team2", "earned"),
    ]
    for actor, result, player, winner, origin in cases:
        page.click(f'[data-quick-result="{result}"]')
        assert page.locator(".quick-side-selector").is_visible()
        page.click(f'[data-quick-side="{actor}"]')
        event = events(page)[-1]
        assert (event["player"], event["action"], event["result"], event["winningTeam"], event["pointOrigin"]) == (
            player, "adverse" if actor == "A" else "generic", result, winner, origin,
        )
        wait_guard(page)
    assert page.locator("#liveScore .service-line").first.is_hidden()
    before = len(events(page)); page.click("#captureUndo")
    assert len(events(page)) == before - 1
    assert not errors
    page.close()
