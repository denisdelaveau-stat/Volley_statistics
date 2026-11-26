"""Substitutions from the capture screen (runtime input), following FIVB Official Volleyball Rules 2025-2028, Rule 15.

Starting rotation of helpers.base_match: P1 setter 1, P2 OH 3, P3 MB 4, P4 OPP 7, P5 OH 5, P6 MB 6; libero 2.
Bench added here: OH 8, MB 9, OPP 10.
"""
from __future__ import annotations

from helpers import APP_URI, base_match, events


def open_capture(browser, prior_events=None):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    match = base_match(())
    match["team"]["players"] = list(range(1, 11))
    match["team"]["roster"] += [
        {"number": 9, "name": "Player 9", "position": "mb", "focus": True},
        {"number": 10, "name": "Player 10", "position": "opp", "focus": True},
    ]
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          localStorage.setItem('volleyCapture.runtimeInput.preferences.v1', JSON.stringify({
            runtimeMode: 'FOCUS', runtimeHighlights: true, runtimeHaptics: false
          }));
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        {"match": match, "events": prior_events or []},
    )
    page.reload()
    page.wait_for_timeout(200)
    return page, errors


def substitute(page, out, incoming):
    page.locator("[data-runtime-sub-open]").click()
    page.locator(f'[data-sub-out="{out}"]').click()
    page.locator(f'[data-sub-in="{incoming}"]').click()
    page.wait_for_timeout(80)


def court_numbers(page):
    return page.locator("#runtimeInputRoot [data-runtime-author]:not([data-runtime-author='A'])").evaluate_all(
        "buttons => buttons.map(b => b.dataset.runtimeAuthor)"
    )


def stored_match(page):
    return page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")


def test_substitution_is_recorded_and_the_court_updates(browser):
    page, errors = open_capture(browser)
    substitute(page, 7, 10)
    last = events(page)[-1]
    assert last["type"] == "SUBSTITUTION" and last["playerOut"] == 7 and last["playerIn"] == 10
    subs = stored_match(page)["subs"]
    assert [(s["set"], s["at"], s["out"], s["in"]) for s in subs] == [(1, 0, 7, 10)]
    court = court_numbers(page)
    assert "10" in court and "7" not in court
    assert "remplacement #10 / #7" in page.locator(".runtime-last").inner_text()
    assert page.locator("#runtimeSubs").is_hidden()
    assert not errors
    page.close()


def test_the_sheet_applies_fivb_rule_15(browser):
    page, errors = open_capture(browser)
    substitute(page, 7, 10)
    page.locator("[data-runtime-sub-open]").click()
    assert "1/6 remplacements" in page.locator("#runtimeSubs").inner_text()
    page.locator('[data-sub-out="10"]').click()
    # 15.6.2: substitute 10 can only be replaced by starter 7.
    assert page.locator("[data-sub-in]").evaluate_all("b => b.map(x => x.dataset.subIn)") == ["7"]
    page.locator(".runtime-subs-refused summary").click()
    assert "15.6.2" in page.locator(".runtime-subs-refused").inner_text()
    # 15.5.1: the libero is never offered.
    assert page.locator('[data-sub-in="2"]').count() == 0
    page.locator('[data-sub-in="7"]').click()
    page.wait_for_timeout(80)
    # 15.6.1: starter 7 came back; 10 cannot enter again in this set.
    page.locator("[data-runtime-sub-open]").click()
    page.locator('[data-sub-out="3"]').click()
    offered = page.locator("[data-sub-in]").evaluate_all("b => b.map(x => x.dataset.subIn)")
    assert "10" not in offered and "8" in offered
    assert not errors
    page.close()


def test_no_substitution_during_a_rally(browser):
    rally_started = [{"id": 1, "set": 1, "player": 3, "action": "reception", "result": "neutral", "winningTeam": None,
                      "scoreA": 0, "scoreB": 0}]
    page, errors = open_capture(browser, rally_started)
    page.locator("[data-runtime-sub-open]").click()
    sheet = page.locator("#runtimeSubs").inner_text()
    assert "15.11.1.1" in sheet
    assert page.locator("[data-sub-out]").count() == 0
    assert not errors
    page.close()


def test_undo_removes_the_substitution(browser):
    page, errors = open_capture(browser)
    substitute(page, 7, 10)
    page.wait_for_timeout(600)
    page.locator("[data-runtime-undo]").click()
    page.wait_for_timeout(600)
    assert events(page) == []
    assert stored_match(page)["subs"] == []
    assert "7" in court_numbers(page)
    assert not errors
    page.close()


def test_the_libero_follows_a_substituted_middle_blocker(browser):
    page, errors = open_capture(browser)
    # MB 6 is in P6 and replaced by the libero; MB 9 comes in for 6.
    substitute(page, 6, 9)
    state = page.evaluate(
        """() => {
          const m = JSON.parse(localStorage.getItem('volleyCapture.match.v1'));
          const evs = JSON.parse(localStorage.getItem('volleyCapture.events.v1'));
          const st = VolleyRotation.replay(m, evs);
          return { liberoFor: st.liberoFor, p6: VolleyRotation.court(m, st.rot, st).p6.num };
        }"""
    )
    assert state == {"liberoFor": 9, "p6": 2}
    court = court_numbers(page)
    assert "2" in court and "6" not in court and "9" not in court
    assert not errors
    page.close()
