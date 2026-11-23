"""Match Hub v1.21.0 functional, data, import, and accessibility acceptance."""
from __future__ import annotations

import json
from pathlib import Path

from helpers import APP_URI, base_match


def open_empty(browser, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    return page, errors


def archive(match_id, home, away, date, score=(3, 1), status="completed"):
    match = base_match()
    match.update(
        {
            "id": match_id,
            "name": f"{home}_vs_{away}",
            "status": status,
            "matchDate": date,
            "updatedAt": date,
            "homeSetsWon": score[0],
            "awaySetsWon": score[1],
            "team": {**match["team"], "name": home},
            "opponent": {"name": away},
        }
    )
    return {"format": "volley-live-capture", "version": 1, "match": match, "events": [], "chartData": []}


def test_approved_labels_hierarchy_empty_states_and_semantics(browser):
    page, errors = open_empty(browser)
    assert page.locator("#matchHubTitle").inner_text() == "MATCH HUB"
    assert page.locator(".match-hub-head p").inner_text().startswith("Your match starts here")
    assert page.locator(".match-hub-card .mh-title").all_inner_texts() == [
        "NEW MATCH",
        "CONTINUE MATCH",
        "VIEW MATCH",
    ]
    assert page.locator("#homeNew .mh-subtitle").inner_text() == "Set up teams and start tracking"
    assert page.locator("#homeContinueInfo").inner_text() == "No match in progress"
    assert page.locator("#homeContinue").get_attribute("aria-disabled") == "true"
    assert page.locator("#matchHubActiveSummary").is_hidden()
    assert page.locator("#homeOpen .mh-subtitle").inner_text() == "Explore scores, timeline and stats"
    assert page.locator("#matchHubRecentList").inner_text().startswith("No matches yet")
    assert page.locator("#matchHubImport").inner_text() == "Import match"
    assert page.locator("#matchHub button").evaluate_all("els => els.every(e => e.tagName === 'BUTTON')")
    assert "18" not in page.locator("#matchHub").inner_text()
    assert not errors
    page.close()


def test_active_match_uses_persisted_status_score_set_and_saved_time(browser):
    page, errors = open_empty(browser)
    match = base_match()
    match.update({"id": "active-1", "status": "paused", "currentSet": 2, "updatedAt": "2026-11-23T18:30:00Z"})
    events = [
        {"set": 2, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 18, "scoreB": 16}
    ]
    page.evaluate(
        """payload => {
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        {"match": match, "events": events},
    )
    page.reload()
    assert not page.locator("#homeContinue").is_disabled()
    assert page.locator("#matchHubTeams").inner_text() == "Antibes vs Nice"
    assert page.locator("#matchHubScore").inner_text() == "18 – 16"
    assert page.locator("#matchHubMeta").inner_text().startswith("Set 2 • Saved")
    assert "score 18 to 16" in page.locator("#homeContinue").get_attribute("aria-label")

    page.locator("#homeNew").click()
    assert page.locator("#matchHubDecision").is_visible()
    assert "Antibes vs Nice" in page.locator("#matchHubDecisionText").inner_text()
    assert page.locator("#matchHubContinueCurrent").inner_text() == "Continue current match"
    assert page.locator("#matchHubSaveStart").inner_text() == "Save current & start another"
    page.locator("#matchHubDecision [data-dialog-close]").click()
    assert not errors
    page.close()


def test_completed_recent_matches_are_sorted_limited_and_show_set_scores(browser):
    page, errors = open_empty(browser)
    rows = [
        {"id": "old", "raw": archive("old", "Old Home", "Old Away", "2026-11-20T10:00:00Z", (2, 3)), "sourceName": "old.json"},
        {"id": "new", "raw": archive("new", "New Home", "New Away", "2026-11-22T10:00:00Z", (3, 1)), "sourceName": "new.json"},
        {"id": "mid", "raw": archive("mid", "Mid Home", "Mid Away", "2026-11-21T10:00:00Z", (3, 2)), "sourceName": "mid.json"},
    ]
    page.evaluate("rows => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify(rows))", rows)
    page.reload()
    recent = page.locator(".mh-recent-row")
    assert recent.count() == 2
    assert recent.nth(0).locator(".mh-recent-teams").inner_text() == "New Home vs New Away"
    assert recent.nth(0).locator(".mh-result").inner_text() == "3 – 1"
    assert recent.nth(1).locator(".mh-recent-teams").inner_text() == "Mid Home vs Mid Away"
    page.locator("#matchHubSeeAll").click()
    assert page.locator("#matchHubSelector").is_visible()
    assert page.locator("#matchHubSelectorList .mh-selector-item").count() == 3
    assert not errors
    page.close()


def test_view_match_empty_selector_and_new_match_existing_workflow(browser):
    page, errors = open_empty(browser)
    page.locator("#homeOpen").click()
    assert page.locator("#matchHubSelector").is_visible()
    assert "No matches available" in page.locator("#matchHubSelectorList").inner_text()
    page.locator("#matchHubSelector [data-dialog-close]").click()
    page.locator("#homeNew").click()
    assert page.locator("#setupScreen").is_visible()
    assert page.locator("#suTitle").inner_text() == "Sélectionne ton équipe"
    assert not errors
    page.close()


def test_import_rejects_invalid_json_unsafe_keys_and_duplicate_ids(browser):
    page, errors = open_empty(browser)
    invalid = {"name": "bad.json", "mimeType": "application/json", "buffer": b"{bad"}
    page.locator("#matchHubFile").set_input_files(invalid)
    assert "Invalid JSON syntax" in page.locator("#matchHubStatus").inner_text()

    unsafe_payload = json.dumps({"format": "volley-live-capture", "version": 1, "__proto__": {}, "match": base_match(), "events": []})
    unsafe = {"name": "unsafe.json", "mimeType": "application/json", "buffer": unsafe_payload.encode()}
    page.locator("#matchHubFile").set_input_files(unsafe)
    assert "Unsafe object keys" in page.locator("#matchHubStatus").inner_text()

    raw = archive("duplicate", "Home", "Away", "2026-11-22T10:00:00Z")
    page.evaluate(
        "row => localStorage.setItem('volleyMatchHub.history.v1', JSON.stringify([row]))",
        {"id": "duplicate", "raw": raw, "sourceName": "existing.json"},
    )
    page.reload()
    valid = {"name": "duplicate.json", "mimeType": "application/json", "buffer": json.dumps(raw).encode()}
    page.locator("#matchHubFile").set_input_files(valid)
    assert page.locator("#matchHubDuplicate").is_visible()
    assert "Open the existing match" in page.locator("#matchHubDuplicateText").inner_text()
    assert not errors
    page.close()


def test_missing_save_timestamp_is_reported_honestly(browser):
    page, errors = open_empty(browser)
    match = base_match()
    match.update({"id": "no-save", "status": "live"})
    match.pop("createdAt", None)
    page.evaluate(
        """m => {
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(m));
          localStorage.setItem('volleyCapture.events.v1', '[]');
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        match,
    )
    page.reload()
    assert "Save status unavailable" in page.locator("#matchHubMeta").inner_text()
    assert "18" not in page.locator("#matchHubActiveSummary").inner_text()
    assert not errors
    page.close()


def test_primary_match_hub_palette_meets_wcag_text_contrast():
    """Both orange-gradient endpoints keep white card text above 4.5:1."""
    import re

    css = (Path(__file__).resolve().parents[1] / "match-hub.css").read_text(encoding="utf-8")

    def rgb(hex_color):
        value = hex_color.lstrip("#")
        return [int(value[index : index + 2], 16) / 255 for index in (0, 2, 4)]

    def luminance(hex_color):
        channels = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in rgb(hex_color)]
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]

    def contrast(first, second="#ffffff"):
        values = sorted((luminance(first), luminance(second)), reverse=True)
        return (values[0] + 0.05) / (values[1] + 0.05)

    colors = dict(re.findall(r"--(match-hub-accent(?:-light)?):\s*(#[0-9a-fA-F]{6})", css))
    assert contrast(colors["match-hub-accent"]) >= 4.5
    assert contrast(colors["match-hub-accent-light"]) >= 4.5
