"""Shared Match Library, imports, read-only routing, and reports acceptance for v1.26.0."""
from __future__ import annotations

import json
from helpers import APP_URI, base_match


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
    match.update({"id": "active-1", "status": "paused", "currentSet": 2, "updatedAt": "2026-11-24T07:00:00Z"})
    events = [{"set": 2, "player": 3, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 18, "scoreB": 16}]
    page.evaluate(
        """payload => {
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""", {"match": match, "events": events}
    )
    page.reload()


def test_empty_library_has_explicit_zero_states_and_no_demo_match(browser):
    page, errors = open_empty(browser)
    open_library(page)
    assert page.locator("#matchLibraryTitle").inner_text() == "MATCH LIBRARY"
    assert page.locator(".library-filters span").all_inner_texts() == ["0", "0", "0"]
    assert "0 matches" in page.locator("#matchLibraryList").inner_text()
    assert "Cannes" not in page.locator("#matchLibraryScreen").inner_text()
    assert page.locator("#librarySelected").is_hidden()
    assert not errors
    page.close()


def test_active_match_is_selected_shared_and_clearly_live_read_only(browser):
    page, errors = open_empty(browser)
    seed_active(page)
    open_library(page, "coach")
    assert page.locator("#libraryActiveCount").inner_text() == "1"
    assert page.locator(".library-card").count() == 1
    assert page.locator("#librarySelectedName").inner_text() == "Antibes vs Nice"
    assert page.locator("#librarySelectedState").inner_text() == "LIVE"
    assert "READ ONLY" in page.locator("#librarySelected").inner_text()
    assert page.locator(".library-actions button").all_inner_texts() == [
        "SELECTED", "CONTINUE CAPTURE", "COACH VIEW", "SPECTATOR", "REPORTS"
    ]
    assert not errors
    page.close()


def test_finished_and_imported_filters_are_separate(browser):
    page, errors = open_empty(browser)
    rows = [
        {"id": "finished", "raw": archive("finished", "Home", "Away", "2026-11-22T10:00:00Z"), "sourceName": "local.json", "sourceType": "finished"},
        {"id": "imported", "raw": archive("imported", "Import Home", "Import Away", "2026-11-21T10:00:00Z"), "sourceName": "import.json", "sourceType": "imported"},
    ]
    page.evaluate("rows => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify(rows))", rows)
    page.reload(); open_library(page)
    assert page.locator(".library-filters span").all_inner_texts() == ["0", "1", "1"]
    assert "Home vs Away" in page.locator("#matchLibraryList").inner_text()
    page.locator("[data-library-filter=imported]").click()
    assert "Import Home vs Import Away" in page.locator("#matchLibraryList").inner_text()
    assert page.locator(".library-state").inner_text() == "IMPORTED"
    assert not errors
    page.close()


def test_match_json_import_rejects_bad_data_and_stores_valid_data_as_imported(browser):
    page, errors = open_empty(browser)
    open_library(page)
    page.locator("#matchLibraryFile").set_input_files({"name": "bad.json", "mimeType": "application/json", "buffer": b"{bad"})
    assert "Invalid JSON syntax" in page.locator("#matchLibraryStatus").inner_text()

    unsafe = json.dumps({"format": "volley-live-capture", "version": 1, "__proto__": {}, "match": base_match(), "events": []})
    page.locator("#matchLibraryFile").set_input_files({"name": "unsafe.json", "mimeType": "application/json", "buffer": unsafe.encode()})
    page.wait_for_function("() => document.querySelector('#matchLibraryStatus').textContent.includes('Unsafe object keys')")

    raw = archive("import-ok", "Imported", "Opponent", "2026-11-23T10:00:00Z")
    page.locator("#matchLibraryFile").set_input_files({"name": "valid.json", "mimeType": "application/json", "buffer": json.dumps(raw).encode()})
    assert "read-only mode" in page.locator("#matchLibraryStatus").inner_text()
    assert page.locator("#libraryImportedCount").inner_text() == "1"
    assert page.locator("#librarySelectedState").inner_text() == "IMPORTED"
    stored = page.evaluate("JSON.parse(localStorage.getItem('volleyMatchHub.history.v1'))")
    assert stored[0]["sourceType"] == "imported"
    assert not errors
    page.close()


def test_duplicate_import_uses_conflict_dialog_without_overwriting(browser):
    page, errors = open_empty(browser)
    raw = archive("duplicate", "Home", "Away", "2026-11-22T10:00:00Z")
    page.evaluate("row => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify([row]))", {"id": "duplicate", "raw": raw, "sourceName": "existing.json", "sourceType": "finished"})
    page.reload(); open_library(page)
    page.locator("#matchLibraryFile").set_input_files({"name": "duplicate.json", "mimeType": "application/json", "buffer": json.dumps(raw).encode()})
    assert page.locator("#matchHubDuplicate").is_visible()
    assert "Open the existing match" in page.locator("#matchHubDuplicateText").inner_text()
    assert not errors
    page.close()


def test_selected_match_opens_coach_read_only_and_returns_to_library(browser):
    page, errors = open_empty(browser)
    seed_active(page); open_library(page, "coach")
    page.locator("[data-library-action=coach]").click()
    assert page.locator("#coachScreen").is_visible()
    assert page.locator("#coachLiveLabel").inner_text() == "LIVE · MATCH"
    assert page.locator("#coachScreen #capturePanel, #coachScreen [data-result], #coachScreen #historyToggle").count() == 0
    page.locator("#coachHome").click()
    assert page.locator("#matchLibraryScreen").is_visible()
    assert not errors
    page.close()


def test_match_reports_are_read_only_and_offer_existing_export_points(browser):
    page, errors = open_empty(browser)
    seed_active(page); open_library(page, "reports")
    page.locator("[data-library-action=report]").click()
    assert page.locator("#matchReportDialog").is_visible()
    assert "READ ONLY" in page.locator("#matchReportText").inner_text()
    assert page.locator("#matchReportDialog .mh-dialog-actions button").all_inner_texts() == [
        "Export HTML report", "Export event CSV", "Export official JSON", "Close"
    ]
    assert not errors
    page.close()


def test_new_match_conflict_dialog_and_capture_access_remain_available(browser):
    page, errors = open_empty(browser)
    seed_active(page)
    page.locator("#homeSetupCapture").click(); page.locator("#setupMatchCapture").click()
    page.locator("#homeNew").click()
    assert page.locator("#matchHubDecision").is_visible()
    assert "Antibes vs Nice" in page.locator("#matchHubDecisionText").inner_text()
    assert page.locator("#matchHubContinueCurrent").inner_text() == "Continue current match"
    assert not errors
    page.close()
