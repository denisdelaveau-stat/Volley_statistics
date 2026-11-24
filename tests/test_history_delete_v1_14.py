"""v1.14.0 last-History-row Delete, full rollback, persistence and mobile layout."""
from __future__ import annotations

import copy

from helpers import base_match, events, open_match, wait_guard


def _open_history(page):
    if page.locator("#historyPanel").is_hidden():
        page.click("#historyToggle")


def _direct_point(page, side, result="point"):
    page.click(f'[data-quick-result="{result}"]')
    page.click(f'[data-quick-side="{side}"]')


def _delete_last(page):
    _open_history(page)
    page.click("[data-delete-last]")


def _score(page):
    return page.locator("#liveScore .digit-box").all_inner_texts()


def _court_state(page):
    return page.evaluate("({serving:window.__court.st.serving,rotations:window.__court.st.rotations,rot:window.__court.st.rot})")


def _match_with_reserve():
    match = copy.deepcopy(base_match("advanced", focus_off=()))
    match["team"]["roster"].append({"number": 12, "name": "Reserve OH", "position": "oh", "present": True, "focus": True})
    match["team"]["players"].append(12)
    for row in match["team"]["roster"]:
        row["present"] = True
    return match


def _open_custom(browser, match):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto((__import__("helpers").APP_URI))
    page.evaluate(
        """match => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(match));
          localStorage.setItem('volleyCapture.events.v1', '[]');
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        match,
    )
    page.reload(); page.wait_for_timeout(120)
    return page, errors


def test_delete_home_point_restores_empty_score_and_history(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    assert page.locator("#captureUndo").count() == 0
    _direct_point(page, "T")
    assert _score(page) == ["1", "0"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]
    assert page.locator("#captureHistory .history-empty").inner_text() == "No action recorded."
    assert page.locator("[data-delete-last]").count() == 0
    assert not errors
    page.close()


def test_delete_away_point_and_error_and_neutral(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    _direct_point(page, "A")
    assert _score(page) == ["0", "1"]
    _delete_last(page)
    assert _score(page) == ["0", "0"]
    page.wait_for_timeout(470)

    page.click('.court-grid [data-zone="p2"]')
    page.click('[data-quick-action="attack"]')
    page.click('[data-quick-result="error"]')
    assert events(page)[-1]["result"] == "error" and _score(page) == ["0", "1"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]
    page.wait_for_timeout(470)

    page.click('.court-grid [data-zone="p2"]')
    page.click('[data-quick-action="attack"]')
    page.click('[data-quick-result="neutral"]')
    assert events(page)[-1]["winningTeam"] is None and _score(page) == ["0", "0"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]
    assert not errors
    page.close()


def test_delete_restores_score_service_and_sideout_rotation(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    _direct_point(page, "A")
    wait_guard(page)
    before = _court_state(page)
    assert before["serving"] == "B" and before["rotations"] == 0
    _direct_point(page, "T")
    after = _court_state(page)
    assert after["serving"] == "A" and after["rotations"] == 1
    _delete_last(page)
    restored = _court_state(page)
    assert _score(page) == ["0", "1"]
    assert restored == before
    assert not errors
    page.close()


def test_delete_after_substitution_keeps_substitution_and_deleting_substitution_reverts_it(browser):
    page, errors = _open_custom(browser, _match_with_reserve())
    page.click("#subToggle"); page.click('.court-grid [data-player="3"]'); page.click('[data-in="12"]')
    assert page.locator('.court-grid [data-player="12"]').count() == 1
    _direct_point(page, "T")
    _delete_last(page)
    assert len(events(page)) == 1 and events(page)[0]["type"] == "SUBSTITUTION"
    match = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
    assert len(match["subs"]) == 1 and page.locator('.court-grid [data-player="12"]').count() == 1
    page.wait_for_timeout(470)
    _delete_last(page)
    assert events(page) == []
    match = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
    assert match["subs"] == [] and page.locator('.court-grid [data-player="3"]').count() == 1
    assert not errors
    page.close()


def test_only_latest_row_is_deletable_and_double_click_is_guarded(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    _direct_point(page, "T"); wait_guard(page); _direct_point(page, "A")
    _open_history(page)
    rows = page.locator("#captureHistory tr")
    assert rows.count() == 2
    assert rows.nth(0).locator("[data-delete-last]").count() == 1
    assert rows.nth(1).locator("[data-delete-last]").count() == 0
    page.evaluate("window.VLCDeleteLastAction(); window.VLCDeleteLastAction();")
    assert len(events(page)) == 1
    assert page.evaluate("window.VLC_HISTORY_DELETES_BLOCKED") >= 1
    assert not errors
    page.close()


def test_deleted_state_persists_after_reload(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    _direct_point(page, "T"); wait_guard(page); _direct_point(page, "A")
    _delete_last(page)
    assert len(events(page)) == 1 and _score(page) == ["1", "0"]
    page.reload(); page.wait_for_timeout(150)
    assert len(events(page)) == 1
    if page.locator("#homeScreen").is_visible():
        page.click("#homeSetupCapture"); page.click("#setupMatchCapture")
        page.click("#homeContinue")
    assert _score(page) == ["1", "0"]
    _open_history(page)
    assert page.locator("#captureHistory tr").count() == 1
    assert page.locator("[data-delete-last]").count() == 1
    assert not errors
    page.close()


def test_history_delete_fits_390_by_844_without_horizontal_overflow(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    _direct_point(page, "T")
    _open_history(page)
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator("#captureHistory tr").nth(0).locator("td").count() == 5
    assert page.locator("[data-delete-last]").is_visible()
    assert page.locator("[data-delete-last]").evaluate("e => {const b=e.getBoundingClientRect(), h=document.querySelector('.history-wrap').getBoundingClientRect(); return b.left>=h.left && b.right<=h.right}")
    assert not errors
    page.close()
