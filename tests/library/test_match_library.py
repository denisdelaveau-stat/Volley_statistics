"""Match Library single-row redesign acceptance for VolleyLive v1.28.0."""
from __future__ import annotations

import json
from playwright.sync_api import expect
from helpers import APP_URI, base_match

UI_LANGUAGE = "en"  # assertions below use the English interface


def archive(match_id, home, away, date, score=(3, 1), status="completed"):
    match = base_match()
    match.update({
        "id": match_id, "name": f"{home}_vs_{away}", "status": status,
        "matchDate": date, "updatedAt": date, "homeSetsWon": score[0], "awaySetsWon": score[1],
        "team": {**match["team"], "name": home}, "opponent": {"name": away},
    })
    return {"format": "volley-live-capture", "version": 1, "match": match, "events": [], "chartData": []}


def open_empty(browser, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    return page, errors


def open_library(page, mode="library"):
    page.locator("#homeInsights").click()
    page.locator({"library": "#insightsMatchLibrary", "coach": "#insightsCoach", "spectator": "#insightsSpectator", "reports": "#insightsReports"}[mode]).click()


def seed_active(page):
    match = base_match()
    match.update({"id": "active-1", "status": "paused", "currentSet": 2, "updatedAt": "2026-11-24T07:00:00Z", "homeSetsWon": 1, "awaySetsWon": 1})
    events = [{"set": 2, "player": 3, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 18, "scoreB": 16}]
    page.evaluate(
        """payload => {
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""", {"match": match, "events": events}
    )
    page.reload()


def test_empty_library_has_new_header_filters_and_disabled_actions(browser):
    page, errors = open_empty(browser)
    open_library(page)
    assert page.locator("#matchLibraryTitle").inner_text() == "MATCH LIBRARY"
    assert page.locator("#matchLibrarySubtitle").inner_text() == "Choose a match, then open a view."
    assert page.locator(".library-filters button").all_inner_texts() == ["All 0", "Live 0", "Finished 0"]
    assert "No matches yet." in page.locator("#matchLibraryList").inner_text()
    assert page.locator("[data-empty-import]").is_visible()
    assert page.locator(".library-action-bar button:disabled").count() == 3
    assert page.locator("#libraryLegend").is_hidden()
    assert "Cannes" not in page.locator("#matchLibraryScreen").inner_text()
    assert not errors
    page.close()


def test_live_match_is_one_selected_row_with_fixed_action_bar(browser):
    page, errors = open_empty(browser)
    seed_active(page)
    open_library(page, "coach")
    assert page.locator("#libraryAllCount").inner_text() == "1"
    assert page.locator("#libraryLiveCount").inner_text() == "1"
    assert page.locator(".library-row").count() == 1
    row = page.locator(".library-row")
    assert row.get_attribute("aria-selected") == "true"
    assert "Antibes" in row.inner_text() and "Nice" in row.inner_text()
    assert "1 – 1" in row.inner_text() and "S2 · 18–16" in row.inner_text()
    assert page.locator(".library-row .library-check").inner_text() == "✓"
    assert page.locator("#libraryOpenCoach").is_enabled()
    assert page.locator("#libraryOpenSpectator").is_enabled()
    assert page.locator("#libraryOpenReports").is_enabled()
    assert not errors
    page.close()


def test_finished_filter_includes_local_and_imported_matches(browser):
    page, errors = open_empty(browser)
    rows = [
        {"id": "finished", "raw": archive("finished", "Home", "Away", "2026-11-22T10:00:00Z"), "sourceName": "local.json", "sourceType": "finished"},
        {"id": "imported", "raw": archive("imported", "Import Home", "Import Away", "2026-11-21T10:00:00Z"), "sourceName": "import.json", "sourceType": "imported"},
    ]
    page.evaluate("rows => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify(rows))", rows)
    page.reload(); open_library(page)
    assert page.locator(".library-filters button").all_inner_texts() == ["All 2", "Live 0", "Finished 2"]
    page.locator("[data-library-filter=finished]").click()
    assert page.locator(".library-row").count() == 2
    assert "Home" in page.locator("#matchLibraryList").inner_text()
    assert "Import Home" in page.locator("#matchLibraryList").inner_text()
    page.locator(".library-row").nth(1).locator(".library-info").click()
    assert page.locator("#matchInfoDialog").is_visible()
    assert "Imported" in page.locator("#matchInfoFields").inner_text()
    assert "Read only" in page.locator("#matchInfoFields").inner_text()
    assert "import.json" in page.locator("#matchInfoFields").inner_text()
    assert not errors
    page.close()


def test_filter_and_selection_are_persisted_and_keyboard_accessible(browser):
    page, errors = open_empty(browser)
    rows = [
        {"id": "one", "raw": archive("one", "Alpha", "Beta", "2026-11-22T10:00:00Z"), "sourceName": "one.json", "sourceType": "finished"},
        {"id": "two", "raw": archive("two", "Gamma", "Delta", "2026-11-23T10:00:00Z"), "sourceName": "two.json", "sourceType": "finished"},
    ]
    page.evaluate("rows => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify(rows))", rows)
    page.reload(); open_library(page)
    page.locator("[data-library-filter=finished]").click()
    page.locator("#matchLibraryList").press("ArrowDown")
    selected = page.locator(".library-row.selected")
    assert "Alpha" in selected.inner_text()
    assert page.evaluate("JSON.parse(localStorage.getItem('vl.library.filter'))") == "finished"
    assert page.evaluate("JSON.parse(localStorage.getItem('vl.library.selectedId')).id") == "one"
    page.reload(); open_library(page)
    assert page.locator("[data-library-filter=finished]").get_attribute("aria-current") == "page"
    assert "Alpha" in page.locator(".library-row.selected").inner_text()
    assert not errors
    page.close()


def test_import_validation_duplicate_and_read_only_metadata_remain_available(browser):
    page, errors = open_empty(browser)
    open_library(page)
    page.locator("#matchLibraryFile").set_input_files({"name": "bad.json", "mimeType": "application/json", "buffer": b"{bad"})
    expect(page.locator("#matchLibraryStatus")).to_contain_text("Invalid JSON syntax")

    raw = archive("import-ok", "Imported", "Opponent", "2026-11-23T10:00:00Z")
    payload = json.dumps(raw).encode()
    page.locator("#matchLibraryFile").set_input_files({"name": "valid.json", "mimeType": "application/json", "buffer": payload})
    expect(page.locator("#matchLibraryStatus")).to_contain_text("read-only mode")
    assert page.locator("#libraryFinishedCount").inner_text() == "1"
    assert page.locator(".library-row.selected").count() == 1
    assert page.evaluate("JSON.parse(localStorage.getItem('vl.library.filter'))") == "all"

    page.locator("#matchLibraryFile").set_input_files({"name": "valid.json", "mimeType": "application/json", "buffer": payload})
    expect(page.locator("#matchLibraryStatus")).to_contain_text("already in the library")
    assert page.locator("#matchHubDuplicate").is_visible()
    assert page.locator("#matchHubImportCopy").is_visible()
    assert not errors
    page.close()


def test_selected_match_actions_keep_coach_spectator_and_reports_routes(browser):
    page, errors = open_empty(browser)
    seed_active(page); open_library(page, "coach")
    page.locator("#libraryOpenCoach").click()
    assert page.locator("#coachScreen").is_visible()
    assert page.locator("#coachLiveLabel").inner_text() == "LIVE · MATCH"
    page.locator("#coachHome").click()
    assert page.locator("#matchLibraryScreen").is_visible()
    page.locator("#libraryOpenReports").click()
    assert page.locator("#matchReportDialog").is_visible()
    assert "READ ONLY" in page.locator("#matchReportText").inner_text()
    assert page.locator("#matchReportDialog .mh-dialog-actions button").all_inner_texts() == [
        "Export HTML report", "Export event CSV", "Export official JSON", "Close"
    ]
    assert not errors
    page.close()


def test_rows_stay_single_line_at_narrow_phone_width(browser):
    page, errors = open_empty(browser, {"width": 360, "height": 800})
    rows = [{"id": "long", "raw": archive("long", "A very long home team name", "Another very long away team name", "2026-11-22T10:00:00Z"), "sourceName": "long.json", "sourceType": "finished"}]
    page.evaluate("rows => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify(rows))", rows)
    page.reload(); open_library(page)
    box = page.locator(".library-row").bounding_box()
    assert box and box["height"] <= 59
    assert page.locator(".library-context").evaluate("el => getComputedStyle(el).display") == "none"
    assert not errors
    page.close()
