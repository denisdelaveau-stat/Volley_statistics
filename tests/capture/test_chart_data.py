"""Capture screen chart data (volleyCapture.chartData.v1): no chart is drawn on the capture screen, but one point per
scoring rally of the current set is still stored, reloaded and exported (Match Hub and statistics/adapter.js read it)."""
from __future__ import annotations

from capture_support import open_runtime

CHART_KEY = "volleyCapture.chartData.v1"


def _record(page, author, action, result):
    page.locator(f'[data-runtime-author="{author}"]').click()
    page.locator(f'[data-runtime-action="{action}"]').click()
    page.locator(f'[data-runtime-result="{result}"]').click()
    # Runtime input ignores taps for 500 ms after each commit (double-tap guard).
    page.wait_for_timeout(600)


def _chart(page):
    return page.evaluate(f"JSON.parse(localStorage.getItem('{CHART_KEY}') || '[]')")


def test_scoring_rallies_are_stored_reloaded_and_exported_without_a_statistics_panel(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    assert page.locator("#statsPanel, #statsToggle").count() == 0
    _record(page, "3", "attack", "point")  # point for our team
    _record(page, "3", "attack", "error")  # point for the opponent
    points = _chart(page)
    assert [(p["n"], p["a"], p["b"], p["w"]) for p in points] == [(1, 1, 0, "A"), (2, 1, 1, "B")]
    assert points[0]["c"] == 3 and points[0]["action"] == "attack"

    # Reopen the capture screen after a reload, as open_runtime() does.
    page.evaluate("sessionStorage.setItem('volleyCapture.stage', 'capture')")
    page.reload()
    page.wait_for_timeout(160)
    _record(page, "3", "attack", "point")
    assert [(p["n"], p["a"], p["b"]) for p in _chart(page)] == [(1, 1, 0), (2, 1, 1), (3, 2, 1)]

    # The live match read by the Coach View and the Spectator View carries the chart data and its latest score.
    live = page.evaluate("window.VolleyStatsAdapter.fromLocalStorage(localStorage)")
    assert len(live["chartData"]) == 3
    assert live["score"] == {"team1": 2, "team2": 1}
    assert not errors, errors
    page.close()
