"""Second libero (FIVB 19.1.1, 19.3.2): the acting libero is replaced by the other one from the substitution sheet,
between rallies, with a completed rally since the previous libero replacement; it is not a substitution. Each set
line-up chooses its acting libero."""
from __future__ import annotations

from helpers import APP_URI, base_match

MATCH_JS = "JSON.parse(localStorage.getItem('volleyCapture.match.v1'))"


def open_with_two_liberos(browser, events=None, viewport=None):
    """Capture screen; player 8 is registered as a second libero (player 2 is the acting one)."""
    page = browser.new_page(viewport=viewport or {"width": 1180, "height": 820})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    match = base_match(())
    match["team"]["roster"][7]["position"] = "libero"
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


def _point(page):
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-result="point"]').click()
    # Runtime input ignores taps for 500 ms after each commit (double-tap guard).
    page.wait_for_timeout(600)


def _open_sheet(page):
    page.locator("[data-runtime-sub-open]").click()
    return page.locator("#runtimeSubs")


def test_second_libero_replaces_the_acting_one_between_rallies(browser):
    page, errors = open_with_two_liberos(browser)
    sheet = _open_sheet(page)
    assert "Libéro en jeu : #2" in sheet.inner_text()
    swap = sheet.locator('[data-libero-swap="8"]')
    assert swap.is_enabled()
    # The second libero is never offered as a regular substitute.
    assert sheet.locator('[data-sub-in="8"]').count() == 0
    swap.click()
    page.wait_for_timeout(200)
    match = page.evaluate(MATCH_JS)
    assert match["subs"][-1]["libero"] is True and match["subs"][-1]["out"] == 2 and match["subs"][-1]["in"] == 8
    court = page.evaluate(
        """() => { const m = JSON.parse(localStorage.getItem('volleyCapture.match.v1'));
                   const e = JSON.parse(localStorage.getItem('volleyCapture.events.v1'));
                   const r = VolleyRotation.replay(m, e); return Object.values(VolleyRotation.onCourt(m, r.rot, r)); }"""
    )
    assert 8 in court and 2 not in court

    # 19.3.2.1: no second libero replacement at the same break; not a substitution (0/6).
    sheet = _open_sheet(page)
    assert "Set 1 · 0/6 remplacements" in sheet.inner_text()
    assert "règle 19.3.2.1" in sheet.inner_text()
    assert sheet.locator('[data-libero-swap="2"]').is_disabled()
    sheet.locator("[data-sub-close]").click()

    # After a completed rally (the libero stays on court), libero 2 may come back.
    _point(page)
    sheet = _open_sheet(page)
    assert sheet.locator('[data-libero-swap="2"]').is_enabled()
    sheet.locator('[data-libero-swap="2"]').click()
    page.wait_for_timeout(200)
    assert page.evaluate(MATCH_JS)["subs"][-1]["in"] == 2

    # The report lists the libero replacements but does not count them as substitutions.
    report = page.evaluate("VolleyCapture.buildReport()")
    assert report.count("remplacement de libéro") == 2
    assert ">0</td></tr>" in report.split("Joueurs (P / F / N")[0]
    assert not errors, errors
    page.close()


def test_set_line_up_chooses_the_acting_libero(browser):
    won = [
        {
            "id": i, "set": 1, "timestamp": "2026-11-16T12:00:00Z", "time": "12:00:00", "action": "team",
            "result": "point", "player": "T", "winningTeam": "team1", "pointOrigin": "earned",
            "scoreA": i, "scoreB": 0,
        }
        for i in range(1, 26)
    ]
    page, errors = open_with_two_liberos(browser, events=won)
    page.click("#nextSetBtn")
    libero = page.locator("[data-lineup-libero]")
    assert libero.input_value() == "2"
    assert sorted(libero.locator("option").evaluate_all("o => o.map(x => x.value)")) == ["", "2", "8"]
    libero.select_option("8")
    page.click("[data-lineup-confirm]")
    page.wait_for_load_state()
    page.wait_for_timeout(300)
    match = page.evaluate(MATCH_JS)
    assert match["setLineups"]["2"]["startingLineup"]["libero"] == 8
    court = page.evaluate(
        """() => { const m = JSON.parse(localStorage.getItem('volleyCapture.match.v1'));
                   const r = VolleyRotation.replay(m, []); return Object.values(VolleyRotation.onCourt(m, r.rot, r)); }"""
    )
    assert 8 in court and 2 not in court
    assert not errors, errors
    page.close()
