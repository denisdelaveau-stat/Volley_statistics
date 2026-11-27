"""Set line-up sheet (FIVB 7.3.2): before each new set the coach confirms or changes the starting line-up, which the
capture, the rotation engine and the substitution rules then use for that set only."""
from __future__ import annotations

from helpers import open_match

MATCH_JS = "JSON.parse(localStorage.getItem('volleyCapture.match.v1'))"


def won_set_one():
    """Set 1 won 25-0 by our team (the capture shows the end-of-set box)."""
    return [
        {
            "id": i, "set": 1, "timestamp": "2026-11-16T12:00:00Z", "time": "12:00:00", "action": "team",
            "result": "point", "player": "T", "winningTeam": "team1", "pointOrigin": "earned",
            "scoreA": i, "scoreB": 0,
        }
        for i in range(1, 26)
    ]


def _select(page, role):
    return page.locator(f'[data-lineup-role="{role}"]')


def _slot(page, zone):
    return page.locator(f'[data-lineup-slot="{zone}"] strong').inner_text()


def test_next_set_line_up_is_prefilled_changed_and_used_for_that_set(browser):
    page, errors = open_match(browser, events=won_set_one(), viewport={"width": 1180, "height": 820})
    page.click("#nextSetBtn")
    sheet = page.locator("#setLineupSheet")
    assert sheet.is_visible()
    assert page.inner_text("#setLineupTitle") == "Composition du set 2"

    # Prefilled with the set 1 line-up: setter 1 in P1, then OH1 3, MB1 4, opposite 7, OH2 5, MB2 6; libero 2.
    assert page.get_attribute('[data-lineup-zone="p1"]', "aria-pressed") == "true"
    prefilled = {role: _select(page, role).input_value() for role in ("setter", "oh1", "mb1", "opposite", "oh2", "mb2")}
    assert prefilled == {"setter": "1", "oh1": "3", "mb1": "4", "opposite": "7", "oh2": "5", "mb2": "6"}
    assert [_slot(page, z) for z in ("p4", "p3", "p2", "p5", "p6", "p1")] == ["7", "4", "3", "5", "6", "1"]
    assert "#2 Player 2" in page.inner_text(".set-lineup-libero")
    # The libero cannot start: not offered in the role lists (19.1).
    assert _select(page, "setter").locator('option[value="2"]').count() == 0

    # New line-up: setter starts in P4, bench player 8 replaces OH1 3.
    page.click('[data-lineup-zone="p4"]')
    _select(page, "oh1").select_option("8")
    assert [_slot(page, z) for z in ("p4", "p5", "p6", "p1", "p2", "p3")] == ["1", "8", "4", "7", "5", "6"]

    # The same player cannot take two roles.
    _select(page, "mb1").select_option("8")
    assert "un seul poste" in page.inner_text(".set-lineup-error")
    assert page.locator("[data-lineup-confirm]").is_disabled()
    _select(page, "mb1").select_option("4")
    assert page.locator(".set-lineup-error").count() == 0

    page.click("[data-lineup-confirm]")
    page.wait_for_load_state()
    page.wait_for_timeout(300)
    match = page.evaluate(MATCH_JS)
    assert match["currentSet"] == 2
    lineup = match["setLineups"]["2"]
    assert lineup["startingRotation"] == {"p4": 1, "p5": 8, "p6": 4, "p1": 7, "p2": 5, "p3": 6}
    assert lineup["startingLineup"]["oh1"] == 8 and lineup["startingLineup"]["libero"] == 2
    # Set 1 keeps its own line-up.
    assert match["startingRotation"] == {"p1": 1, "p2": 3, "p3": 4, "p4": 7, "p5": 5, "p6": 6}

    # The engine starts set 2 from the new line-up; our team receives first in set 2, so the libero replaces
    # MB 4 in P6.
    court = page.evaluate(
        """() => { const m = JSON.parse(localStorage.getItem('volleyCapture.match.v1'));
                   const r = VolleyRotation.replay(m, []); return VolleyRotation.onCourt(m, r.rot, r); }"""
    )
    assert court == {"p4": 1, "p5": 8, "p6": 2, "p1": 7, "p2": 5, "p3": 6}
    # Scoring goes on in set 2 with the starters of set 2.
    page.locator('[data-runtime-author="8"]').click()
    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-result="point"]').click()
    page.wait_for_timeout(600)
    assert page.locator("#liveScore .digit-box").all_inner_texts() == ["1", "0"]
    assert not errors, errors
    page.close()


def test_cancelling_the_line_up_sheet_keeps_the_finished_set(browser):
    page, errors = open_match(browser, events=won_set_one(), viewport={"width": 390, "height": 844})
    page.click("#nextSetBtn")
    assert page.locator("#setLineupSheet").is_visible()
    page.click("[data-lineup-cancel]")
    assert page.locator("#setLineupSheet").is_hidden()
    assert page.evaluate(MATCH_JS)["currentSet"] == 1
    assert "setLineups" not in page.evaluate(MATCH_JS)
    # Escape closes it too.
    page.click("#nextSetBtn")
    page.keyboard.press("Escape")
    assert page.locator("#setLineupSheet").is_hidden()
    assert not errors, errors
    page.close()
