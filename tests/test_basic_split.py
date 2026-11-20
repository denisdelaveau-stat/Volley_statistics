"""v1.11 unified quick-entry acceptance for direct HOME/AWAY capture."""
from helpers import events, open_match, wait_guard


def test_basic_normative_result_bars(browser):
    page, errors = open_match(browser, "basic")
    assert page.inner_text("#appVersion") == "v1.11.0"
    assert page.locator("[data-quick-side]").all_inner_texts() == ["HOME\nAntibes", "AWAY\nNice"]
    assert page.locator("[data-quick-result]").count() == 3
    cases = [
        ("T", "error", "T", "team2", "opponent_error"),
        ("T", "point", "T", "team1", "earned"),
        ("A", "error", "A", "team1", "opponent_error"),
        ("A", "point", "A", "team2", "earned"),
    ]
    for actor, result, player, winner, origin in cases:
        page.click(f'[data-quick-side="{actor}"]')
        page.click(f'[data-quick-result="{result}"]')
        event = events(page)[-1]
        assert (event["player"], event["action"], event["result"], event["winningTeam"], event["pointOrigin"]) == (
            player, "adverse" if actor == "A" else "generic", result, winner, origin,
        )
        wait_guard(page)
    assert page.locator("#liveScore .side-b").get_attribute("class").endswith("serving")
    before = len(events(page)); page.click("#captureUndo")
    assert len(events(page)) == before - 1
    assert not errors
    page.close()
