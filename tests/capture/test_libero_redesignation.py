"""Libero unable to play (FIVB 19.4), from the substitution sheet: the other libero takes over, or a player who is not
on court is re-designated as libero for the rest of the match; the libero declared unable cannot play again."""
from __future__ import annotations

from helpers import APP_URI, base_match

MATCH_JS = "JSON.parse(localStorage.getItem('volleyCapture.match.v1'))"
COURT_JS = """() => { const m = JSON.parse(localStorage.getItem('volleyCapture.match.v1'));
  const e = JSON.parse(localStorage.getItem('volleyCapture.events.v1'));
  const set = e.filter(x => (x.set || 1) === (m.currentSet || 1));
  const r = VolleyRotation.replay(m, set); return Object.values(VolleyRotation.onCourt(m, r.rot, r)); }"""


def open_capture(browser, second_libero=False, events=None, subs=None):
    page = browser.new_page(viewport={"width": 1180, "height": 820})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    match = base_match(())
    if second_libero:
        match["team"]["roster"][7]["position"] = "libero"
    match["subs"] = subs or []
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        {"match": match, "events": events or []},
    )
    page.reload()
    page.wait_for_timeout(200)
    return page, errors


def _unable_step(page):
    page.locator("[data-runtime-sub-open]").click()
    sheet = page.locator("#runtimeSubs")
    sheet.locator("[data-libero-unable-open]").click()
    return sheet


def test_single_libero_unable_a_bench_player_is_re_designated(browser):
    page, errors = open_capture(browser)
    sheet = _unable_step(page)
    text = sheet.inner_text()
    assert "Libéro #2 indisponible" in text and "règle 19.4" in text.lower()
    # On court: 1, 3, 4, 7, 5 and the libero 2 in place of MB 6; only bench player 8 may become libero.
    options = sheet.locator("[data-libero-redesignate]").evaluate_all("b => b.map(x => x.dataset.liberoRedesignate)")
    assert options == ["8"]
    assert sheet.locator("[data-libero-unable]").count() == 0
    sheet.locator('[data-libero-redesignate="8"]').click()
    page.wait_for_timeout(200)
    last = page.evaluate(MATCH_JS)["subs"][-1]
    assert (last["out"], last["in"], last["libero"], last["unable"], last["redesignated"]) == (2, 8, True, True, True)
    court = page.evaluate(COURT_JS)
    assert 8 in court and 2 not in court
    # The new libero is acting; libero 2 is never offered again, neither is 8 as a regular substitute.
    page.locator("[data-runtime-sub-open]").click()
    text = page.locator("#runtimeSubs").inner_text()
    assert "Libéro en jeu : #8" in text
    assert page.locator('#runtimeSubs [data-libero-swap="2"]').count() == 0
    assert page.locator('#runtimeSubs [data-sub-in="8"], #runtimeSubs [data-sub-in="2"]').count() == 0
    report = page.evaluate("VolleyCapture.buildReport()")
    assert "libéro re-désigné" in report
    assert not errors, errors
    page.close()


def test_second_libero_takes_over_and_the_unable_one_never_comes_back(browser):
    page, errors = open_capture(browser, second_libero=True)
    sheet = _unable_step(page)
    assert sheet.locator("[data-libero-redesignate]").count() == 0
    sheet.locator('[data-libero-unable="8"]').click()
    page.wait_for_timeout(200)
    last = page.evaluate(MATCH_JS)["subs"][-1]
    assert last["unable"] is True and "redesignated" not in last
    assert 8 in page.evaluate(COURT_JS)
    page.locator("[data-runtime-sub-open]").click()
    assert page.locator('#runtimeSubs [data-libero-swap="2"]').count() == 0
    assert not errors, errors
    page.close()


def test_next_set_line_up_does_not_offer_the_unable_libero(browser):
    won = [
        {
            "id": i, "set": 1, "timestamp": "2026-11-16T12:00:00Z", "time": "12:00:00", "action": "team",
            "result": "point", "player": "T", "winningTeam": "team1", "pointOrigin": "earned",
            "scoreA": i, "scoreB": 0,
        }
        for i in range(1, 26)
    ]
    unable = {"set": 1, "at": 0, "out": 2, "in": 8, "libero": True, "unable": True}
    page, errors = open_capture(browser, second_libero=True, events=won, subs=[unable])
    page.click("#nextSetBtn")
    libero = page.locator("[data-lineup-libero]")
    assert libero.input_value() == "8", "the libero acting at the end of set 1 is proposed"
    assert sorted(libero.locator("option").evaluate_all("o => o.map(x => x.value)")) == ["", "8"]
    assert not errors, errors
    page.close()
