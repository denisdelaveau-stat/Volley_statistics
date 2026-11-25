"""Acceptance coverage for VolleyLive v1.28.0 runtime input modes."""
from __future__ import annotations

import json
from pathlib import Path

from helpers import APP_URI, base_match, events


def open_runtime(browser, mode="FOCUS", viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    match = base_match(())
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', '[]');
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          localStorage.setItem('volleyCapture.settings.v1', JSON.stringify({
            setsToWin: 3, detailLevel: 'advanced'
          }));
          localStorage.setItem('volleyCapture.runtimeInput.preferences.v1', JSON.stringify({
            runtimeMode: payload.mode, runtimeHighlights: true, runtimeHaptics: false
          }));
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        {"match": match, "mode": mode},
    )
    page.reload()
    page.wait_for_timeout(160)
    return page, errors


def commit(page, author="3", action="attack", result="point"):
    page.locator(f'[data-runtime-author="{author}"]').click()
    page.locator(f'[data-runtime-action="{action}"]').click()
    page.locator(f'[data-runtime-result="{result}"]').click()
    page.wait_for_timeout(30)


def canonical_subset(event):
    keys = (
        "authorSide", "playerId", "playerNumber", "playerRole", "actionCode",
        "status", "scoreBefore", "scoreAfter", "setNumber", "schemaVersion",
    )
    return {key: event.get(key) for key in keys}


def test_runtime_options_are_available_and_persisted(browser):
    page, errors = open_runtime(browser)
    page.locator('[data-runtime-options]').click()
    assert page.locator('[data-runtime-pref-mode]').count() == 3
    assert page.locator('[data-runtime-pref-mode="SPEED"]').inner_text() == "SPEED+"
    page.locator('[data-runtime-pref-mode="FLOW"]').click()
    saved = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.runtimeInput.preferences.v1'))")
    assert saved["runtimeMode"] == "FLOW"
    match_settings = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.settings.v1'))")
    assert "runtimeMode" not in match_settings
    assert page.locator("html").get_attribute("data-runtime-mode") == "FLOW"
    assert errors == []
    page.close()


def test_settings_screen_does_not_offer_runtime_mode(browser):
    page, errors = open_runtime(browser)
    page.evaluate("sessionStorage.removeItem('volleyCapture.stage')")
    page.reload()
    page.locator("#homeSettings").click()
    assert page.locator("[data-setting-runtime]").count() == 0
    assert "Saisie runtime" not in page.locator("#settingsBody").inner_text()
    assert errors == []
    page.close()


def test_mode_change_preserves_match_score_events_and_pending_selection(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    commit(page, "3", "attack", "point")
    page.wait_for_timeout(520)
    page.locator('[data-runtime-author="2"]').click()
    page.locator('[data-runtime-action="reception"]').click()
    before = page.evaluate("""() => ({
      match: localStorage.getItem('volleyCapture.match.v1'),
      events: localStorage.getItem('volleyCapture.events.v1'),
      score: VolleySets.score(JSON.parse(localStorage.getItem('volleyCapture.events.v1')), 1),
      state: VLRuntimeInput.getState()
    })""")
    page.locator('[data-runtime-mode="FLOW"]').click()
    after = page.evaluate("""() => ({
      match: localStorage.getItem('volleyCapture.match.v1'),
      events: localStorage.getItem('volleyCapture.events.v1'),
      score: VolleySets.score(JSON.parse(localStorage.getItem('volleyCapture.events.v1')), 1),
      state: VLRuntimeInput.getState()
    })""")
    assert after["match"] == before["match"]
    assert after["events"] == before["events"]
    assert after["score"] == before["score"] == {"a": 1, "b": 0}
    assert after["state"]["author"] == before["state"]["author"] == "2"
    assert after["state"]["action"] == before["state"]["action"] == "reception"
    assert after["state"]["stage"] == "result"
    assert after["state"]["mode"] == "FLOW"
    assert page.locator('[data-runtime-result]:disabled').count() == 0
    assert errors == []
    page.close()


def test_focus_is_three_distinct_steps_and_commits_immediately(browser):
    page, errors = open_runtime(browser, "FOCUS")
    assert page.evaluate("VLRuntimeInput.getState().stage") == "player"
    page.locator('[data-runtime-author="3"]').click()
    assert page.evaluate("VLRuntimeInput.getState().stage") == "action"
    page.locator('[data-runtime-action="attack"]').click()
    assert page.evaluate("VLRuntimeInput.getState().stage") == "result"
    page.locator('[data-runtime-result="point"]').click()
    saved = events(page)
    assert len(saved) == 1
    assert saved[0]["actionCode"] == "ATTACK"
    assert saved[0]["status"] == "POSITIVE"
    assert saved[0]["inputMode"] == "FOCUS"
    assert page.evaluate("VLRuntimeInput.getState().stage") == "player"
    assert page.locator("button", has_text="Valider").count() == 0
    assert errors == []
    page.close()


def test_speed_keeps_court_visible_through_action_and_result(browser):
    page, errors = open_runtime(browser, "SPEED", {"width": 820, "height": 1000})
    assert page.locator(".runtime-court").is_visible()
    page.locator('[data-runtime-author="3"]').click()
    assert page.locator(".runtime-court").is_visible()
    assert page.locator('[data-runtime-action]').count() == 7
    page.locator('[data-runtime-action="attack"]').click()
    assert page.locator(".runtime-court").is_visible()
    assert page.locator('[data-runtime-result]').count() == 3
    assert page.locator(".runtime-court").evaluate("el => getComputedStyle(el, '::before').content") == "none"
    assert errors == []
    page.close()


def test_flow_shows_fixed_three_blocks_and_disables_future_steps(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    assert page.locator(".runtime-flow-block").count() == 3
    assert page.locator('[data-runtime-action]').count() == 7
    assert page.locator('[data-runtime-action]:disabled').count() == 7
    assert page.locator('[data-runtime-result]:disabled').count() == 3
    page.locator('[data-runtime-author="3"]').click()
    assert page.locator('[data-runtime-action]:disabled').count() == 0
    page.locator('[data-runtime-action="attack"]').click()
    assert page.locator('[data-runtime-result]:disabled').count() == 0
    assert errors == []
    page.close()


def test_action_grid_order_is_identical_in_all_modes(browser):
    expected = ["service", "reception", "set", "attack", "block", "defense", "freeball"]
    for mode, viewport in (("FOCUS", {"width": 390, "height": 844}), ("SPEED", {"width": 820, "height": 1000}), ("FLOW", {"width": 1180, "height": 820})):
        page, errors = open_runtime(browser, mode, viewport)
        if mode != "FLOW":
            page.locator('[data-runtime-author="3"]').click()
        order = page.locator('[data-runtime-action]').evaluate_all("nodes => nodes.map(n => n.dataset.runtimeAction)")
        assert order == expected
        assert errors == []
        page.close()


def test_same_sequence_produces_same_canonical_event_across_modes(browser):
    records = {}
    for mode, viewport in (("FOCUS", {"width": 390, "height": 844}), ("SPEED", {"width": 820, "height": 1000}), ("FLOW", {"width": 1180, "height": 820})):
        page, errors = open_runtime(browser, mode, viewport)
        commit(page)
        record = events(page)[0]
        records[mode] = canonical_subset(record)
        assert record["inputMode"] == mode
        assert record["eventId"].startswith("evt_")
        assert errors == []
        page.close()
    assert records["FOCUS"] == records["SPEED"] == records["FLOW"]


def test_opponent_is_not_stored_as_a_local_player(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    commit(page, "A", "service", "point")
    record = events(page)[0]
    assert record["authorSide"] == "AWAY"
    assert record["playerId"] is None
    assert record["playerNumber"] is None
    assert record["playerRole"] == "OPPONENT"
    assert record["scoreAfter"] == {"home": 0, "away": 1}
    assert errors == []
    page.close()


def test_change_player_clears_intermediate_selection_without_event(browser):
    page, errors = open_runtime(browser, "FOCUS")
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-change]').click()
    state = page.evaluate("VLRuntimeInput.getState()")
    assert state["stage"] == "player"
    assert state["author"] is None and state["action"] is None
    assert events(page) == []
    assert errors == []
    page.close()


def test_undo_is_atomic_for_event_and_score(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    commit(page)
    assert events(page)[0]["scoreAfter"] == {"home": 1, "away": 0}
    page.wait_for_timeout(520)
    page.locator('[data-runtime-undo]').click()
    assert events(page) == []
    assert page.evaluate("VolleySets.score([], 1)") == {"a": 0, "b": 0}
    assert page.evaluate("VLRuntimeInput.getState().author") is None
    assert errors == []
    page.close()


def test_rapid_double_result_tap_creates_one_event(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="attack"]').click()
    page.evaluate("""() => {
      const button = document.querySelector('[data-runtime-result="point"]');
      button.click(); button.click();
    }""")
    assert len(events(page)) == 1
    assert errors == []
    page.close()


def test_role_preferences_highlight_without_reordering_or_disabling(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="2"]').click()  # libero in fixture
    preferred = page.locator('[data-runtime-action].preferred').evaluate_all("nodes => nodes.map(n => n.dataset.runtimeAction)")
    assert preferred == ["reception", "defense", "freeball"]
    assert page.locator('[data-runtime-action]:disabled').count() == 0
    order = page.locator('[data-runtime-action]').evaluate_all("nodes => nodes.map(n => n.dataset.runtimeAction)")
    assert order == ["service", "reception", "set", "attack", "block", "defense", "freeball"]
    assert errors == []
    page.close()
