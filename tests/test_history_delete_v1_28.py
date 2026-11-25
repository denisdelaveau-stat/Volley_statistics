"""Last-History-row Delete with full rollback, persistence and mobile layout (v1.28 runtime input)."""
from __future__ import annotations

from helpers import events
from test_runtime_input_v1_28 import open_runtime


def _commit(page, author, result="point", action="attack"):
    page.locator(f'[data-runtime-author="{author}"]').click()
    page.locator(f'[data-runtime-action="{action}"]').click()
    page.locator(f'[data-runtime-result="{result}"]').click()
    # Runtime input ignores taps for 500 ms after each commit (double-tap guard).
    page.wait_for_timeout(600)


def _open_history(page):
    if page.locator("#historyPanel").is_hidden():
        page.click("#historyToggle")


def _delete_last(page):
    _open_history(page)
    page.click("[data-delete-last]")
    page.wait_for_timeout(60)


def _score(page):
    return page.locator("#liveScore .digit-box").all_inner_texts()


def test_delete_home_point_restores_empty_score_and_history(browser):
    page, errors = open_runtime(browser)
    _commit(page, "3")
    assert _score(page) == ["1", "0"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]
    assert page.locator("#captureHistory .history-empty").inner_text() == "No action recorded."
    assert page.locator("[data-delete-last]").count() == 0
    assert not errors
    page.close()


def test_delete_away_point_error_and_neutral(browser):
    page, errors = open_runtime(browser)
    _commit(page, "A")
    assert _score(page) == ["0", "1"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]

    _commit(page, "3", "error")
    assert _score(page) == ["0", "1"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]

    _commit(page, "3", "neutral")
    assert len(events(page)) == 1 and _score(page) == ["0", "0"]
    _delete_last(page)
    assert events(page) == [] and _score(page) == ["0", "0"]
    assert not errors
    page.close()


def test_delete_rolls_back_sideout_rotation(browser):
    page, errors = open_runtime(browser)
    _commit(page, "A")
    _commit(page, "3")
    _commit(page, "4")
    assert events(page)[-1]["rotation"] == 1
    _delete_last(page)
    _delete_last(page)
    assert _score(page) == ["0", "1"]
    _commit(page, "4")
    assert events(page)[-1]["rotation"] == 0
    assert not errors
    page.close()


def test_only_latest_row_is_deletable_and_double_delete_is_guarded(browser):
    page, errors = open_runtime(browser)
    _commit(page, "3"); _commit(page, "A")
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
    page, errors = open_runtime(browser)
    _commit(page, "3"); _commit(page, "A")
    _delete_last(page)
    assert len(events(page)) == 1 and _score(page) == ["1", "0"]
    page.reload(); page.wait_for_timeout(160)
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
    page, errors = open_runtime(browser, viewport={"width": 390, "height": 844})
    _commit(page, "3")
    _open_history(page)
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator("#captureHistory tr").nth(0).locator("td").count() == 5
    assert page.locator("[data-delete-last]").is_visible()
    assert page.locator("[data-delete-last]").evaluate("e => {const b=e.getBoundingClientRect(), h=document.querySelector('.history-wrap').getBoundingClientRect(); return b.left>=h.left && b.right<=h.right}")
    assert not errors
    page.close()
