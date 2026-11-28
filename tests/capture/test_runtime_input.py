"""Acceptance coverage for VolleyLive v1.28.0 runtime input modes."""
from __future__ import annotations

import json
from pathlib import Path

from helpers import APP_URI, base_match, events
from capture_support import open_runtime


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


def test_gamepad_configuration_button_opens_gamepad_setup(browser):
    page, errors = open_runtime(browser)
    button = page.locator('[data-runtime-gamepad]')
    assert button.count() == 1
    button.click()
    assert page.locator('#gamepadSettings').is_visible()
    assert page.locator('[data-gamepad-capture]').count() == 1
    assert page.locator('#runtimePrefs').is_hidden()
    assert errors == []
    page.close()


def test_gamepad_capture_mode_displays_dual_selectors(browser):
    page, errors = open_runtime(browser, viewport={"width": 1228, "height": 819})
    page.locator('[data-runtime-mode="GAMEPAD"]').click()
    assert page.locator('.runtime-gamepad-layout').count() == 1
    assert page.locator('.gamepad-inline-layout').count() == 1
    assert page.locator('.gamepad-player-circle').count() == 1
    assert page.locator('.gamepad-action-circle').count() == 1
    assert page.locator('.gamepad-inline-status button').count() == 3
    assert page.locator('.gamepad-touch-sector[data-gamepad-player]').count() == 6
    assert page.locator('.gamepad-touch-sector[data-gamepad-action]').count() == 6
    assert page.locator('.gamepad-touch-center[data-gamepad-player="A"]').get_attribute('aria-label') == "Adversaire"
    assert page.locator('.gamepad-touch-center[data-gamepad-action="freeball"]').get_attribute('aria-label') == "Relance"
    assert page.locator('.gamepad-inline-toolbar [data-runtime-undo]').count() == 1
    assert page.locator('.gamepad-inline-toolbar [data-runtime-sub-open]').count() == 1
    selected_styles = page.evaluate("""() => {
      const style = selector => {
        const path = document.querySelector(selector).querySelector('path');
        return {stroke: getComputedStyle(path).stroke, width: getComputedStyle(path).strokeWidth};
      };
      return {
        selectedPlayer: style('.gamepad-player-circle .gamepad-touch-sector.selected'),
        otherPlayer: style('.gamepad-player-circle .gamepad-touch-sector:not(.selected)'),
        selectedAction: style('.gamepad-action-circle .gamepad-touch-sector.selected'),
        otherAction: style('.gamepad-action-circle .gamepad-touch-sector:not(.selected)')
      };
    }""")
    assert selected_styles["selectedPlayer"]["width"] == selected_styles["otherPlayer"]["width"]
    assert selected_styles["selectedAction"] == selected_styles["otherAction"]
    wheel_backgrounds = page.evaluate("""() => ({
      players: getComputedStyle(document.querySelector('.gamepad-player-circle')).backgroundColor,
      actions: getComputedStyle(document.querySelector('.gamepad-action-circle')).backgroundColor,
      results: getComputedStyle(document.querySelector('.gamepad-inline-status')).backgroundColor,
      playerSector: getComputedStyle(document.querySelector('.gamepad-player-circle [data-gamepad-player="0"] path')).fill,
      actionSector: getComputedStyle(document.querySelector('.gamepad-action-circle [data-gamepad-action="attack"] path')).fill
    })""")
    assert wheel_backgrounds == {
        "players": "rgba(32, 199, 102, 0.32)",
        "actions": "rgba(13, 54, 93, 0.72)",
        "results": "rgba(155, 114, 243, 0.56)",
        "playerSector": "rgb(76, 154, 255)",
        "actionSector": "rgb(155, 114, 243)",
    }
    player_number_size = page.locator('.gamepad-player-circle .gamepad-touch-sector text').evaluate(
        "(element) => getComputedStyle(element).fontSize"
    )
    assert player_number_size == "36px"
    status_alignment = page.locator('.gamepad-inline-status button').first.evaluate(
        "(element) => ({display: getComputedStyle(element).display, align: getComputedStyle(element).alignItems, justify: getComputedStyle(element).justifyItems})"
    )
    assert status_alignment == {"display": "grid", "align": "center", "justify": "center"}
    status_button_height = page.locator('.gamepad-inline-status button').first.evaluate(
        "(element) => getComputedStyle(element).height"
    )
    assert status_button_height == "100px"
    page.locator('.gamepad-touch-center[data-gamepad-player="A"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().author") == "A"
    page.locator('.gamepad-touch-center[data-gamepad-action="freeball"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().action") == "freeball"
    page.locator('.gamepad-touch-sector[data-gamepad-player="0"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().author") != "A"
    page.locator('.gamepad-touch-sector[data-gamepad-action="attack"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().action") == "attack"
    page.locator('.gamepad-inline-status [data-gamepad-status="positive"]').click()
    page.wait_for_timeout(30)
    recorded = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1'))")
    assert recorded[-1]["inputSource"] == "touch"
    assert page.locator('#gamepadCaptureOverlay').is_hidden()
    wheel_width = page.locator('.gamepad-player-circle').evaluate("(element) => element.getBoundingClientRect().width")
    status_width = page.locator('.gamepad-inline-status').evaluate("(element) => element.getBoundingClientRect().width")
    assert 340 <= wheel_width <= 360
    assert 180 <= status_width <= 200
    assert errors == []
    page.close()


def test_runtime_options_are_available_and_persisted(browser):
    page, errors = open_runtime(browser)
    page.locator('[data-runtime-options]').click()
    assert page.locator('[data-runtime-pref-mode]').count() == 4
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


def test_speed_matrix_allows_either_selection_order_and_filters_statuses(browser):
    page, errors = open_runtime(browser, "SPEED", {"width": 1180, "height": 820})
    assert page.locator(".runtime-matrix-horizontal-right").count() == 1
    assert page.locator(".runtime-matrix-section").count() == 3
    assert page.locator(".runtime-matrix-player").count() == 6
    assert page.locator(".runtime-matrix-opponent").count() == 1
    section_backgrounds = page.evaluate("""() => ({
      players: getComputedStyle(document.querySelector('.runtime-matrix-player-section')).backgroundColor,
      actions: getComputedStyle(document.querySelector('.runtime-matrix-action-section')).backgroundColor,
      statuses: getComputedStyle(document.querySelector('.runtime-matrix-status-section')).backgroundColor
    })""")
    assert section_backgrounds == {
        "players": "rgba(32, 199, 102, 0.32)",
        "actions": "rgba(13, 54, 93, 0.72)",
        "statuses": "rgba(155, 114, 243, 0.56)",
    }
    status_button_backgrounds = page.locator(".runtime-matrix-status").evaluate_all(
        "nodes => nodes.map(node => getComputedStyle(node).backgroundColor)"
    )
    assert status_button_backgrounds == ["rgb(16, 46, 80)"] * 3
    status_button_opacities = page.locator(".runtime-matrix-status").evaluate_all(
        "nodes => nodes.map(node => getComputedStyle(node).opacity)"
    )
    assert status_button_opacities == ["0.82"] * 3
    opponent_shape = page.locator(".runtime-matrix-opponent").evaluate(
        "element => ({width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height, radius: getComputedStyle(element).borderRadius})"
    )
    player_shape = page.locator(".runtime-matrix-player").first.evaluate(
        "element => ({width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height})"
    )
    assert opponent_shape["width"] == player_shape["width"]
    assert opponent_shape["height"] == player_shape["height"]
    assert opponent_shape["radius"] == "9px"
    landscape_centers = page.evaluate("""() => {
      const center = selector => {
        const bounds = document.querySelector(selector).getBoundingClientRect();
        return bounds.top + bounds.height / 2;
      };
      return {
        players: center('.runtime-matrix-player-grid'),
        actions: center('.runtime-matrix-action-grid'),
        statuses: center('.runtime-matrix-status-grid')
      };
    }""")
    assert abs(landscape_centers["players"] - landscape_centers["actions"]) < 1
    assert abs(landscape_centers["players"] - landscape_centers["statuses"]) < 1
    assert page.locator(".runtime-matrix-action").evaluate_all(
        "nodes => nodes.map(node => node.dataset.runtimeAction)"
    ) == ["service", "reception", "set", "attack", "block", "defense"]
    assert page.locator('[data-runtime-result]:disabled').count() == 3

    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-author="3"]').click()
    assert page.evaluate("VLRuntimeInput.getState().author") == "3"
    assert page.evaluate("VLRuntimeInput.getState().action") == "attack"
    assert page.locator('[data-runtime-result="point"]').is_enabled()
    page.locator('[data-runtime-result="point"]').click()
    assert events(page)[-1]["actionCode"] == "ATTACK"
    assert page.evaluate("VLRuntimeInput.getState().author") is None
    assert page.evaluate("VLRuntimeInput.getState().action") is None

    page.wait_for_timeout(520)
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="reception"]').click()
    assert page.locator('[data-runtime-result="point"]').is_disabled()
    assert page.locator('[data-runtime-result="neutral"]').is_enabled()
    assert page.locator('[data-runtime-result="error"]').is_enabled()

    page.locator('[data-runtime-action="reception"]').click()
    assert page.evaluate("VLRuntimeInput.getState().action") is None
    assert page.locator('[data-runtime-result]:disabled').count() == 3
    page.locator('[data-runtime-author="3"]').click()
    assert page.evaluate("VLRuntimeInput.getState().author") is None

    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="reception"]').click()
    before_undo = len(events(page))
    page.locator('[data-runtime-undo]').click()
    assert len(events(page)) == before_undo
    assert page.evaluate("VLRuntimeInput.getState().author") is None
    assert page.evaluate("VLRuntimeInput.getState().action") is None
    assert errors == []
    page.close()


def test_speed_matrix_opponent_can_record_without_an_action(browser):
    page, errors = open_runtime(browser, "SPEED", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="A"]').click()
    assert page.locator('[data-runtime-result="point"]').is_enabled()
    assert page.locator('[data-runtime-result="error"]').is_enabled()
    assert page.locator('[data-runtime-result="neutral"]').is_disabled()
    page.locator('[data-runtime-result="error"]').click()
    saved = events(page)[0]
    assert saved["authorSide"] == "AWAY"
    assert saved["playerNumber"] is None
    assert saved["action"] is None
    assert saved["actionCode"] is None
    assert saved["result"] == "error"
    assert saved["scoreAfter"] == {"home": 1, "away": 0}
    assert errors == []
    page.close()


def test_speed_matrix_layout_preferences_follow_orientation_and_preserve_selection(browser):
    page, errors = open_runtime(browser, "SPEED", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="reception"]').click()
    page.locator('[data-runtime-options]').click()
    page.locator('[data-matrix-layout="horizontal-left"]').click()
    assert page.locator(".runtime-matrix-horizontal-left").count() == 1
    assert page.evaluate("VLRuntimeInput.getState().author") == "3"
    assert page.evaluate("VLRuntimeInput.getState().action") == "reception"

    page.set_viewport_size({"width": 820, "height": 1000})
    page.wait_for_selector(".runtime-matrix-vertical-down")
    vertical_shapes = page.evaluate("""() => ({
      opponent: (() => { const rect = document.querySelector('.runtime-matrix-opponent').getBoundingClientRect(); return {width: rect.width, height: rect.height}; })(),
      player: (() => { const rect = document.querySelector('.runtime-matrix-player').getBoundingClientRect(); return {width: rect.width, height: rect.height}; })()
    })""")
    assert vertical_shapes["opponent"]["width"] == vertical_shapes["player"]["width"]
    assert vertical_shapes["opponent"]["height"] == vertical_shapes["player"]["height"]
    page.locator('[data-matrix-layout="vertical-up"]').click()
    assert page.locator(".runtime-matrix-vertical-up").count() == 1
    page.set_viewport_size({"width": 1180, "height": 820})
    page.wait_for_selector(".runtime-matrix-horizontal-left")
    saved = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.runtimeInput.preferences.v1'))")
    assert saved["runtimeMatrixHorizontalLayout"] == "horizontal-left"
    assert saved["runtimeMatrixVerticalLayout"] == "vertical-up"
    assert page.evaluate("VLRuntimeInput.getState().author") == "3"
    assert page.evaluate("VLRuntimeInput.getState().action") == "reception"
    assert errors == []
    page.close()


def test_speed_matrix_substitution_reuses_outgoing_player_slot(browser):
    page, errors = open_runtime(browser, "SPEED", {"width": 1180, "height": 820})
    assert page.locator(".runtime-matrix-player").evaluate_all(
        "nodes => nodes.map(node => node.dataset.runtimeAuthor)"
    ) == ["7", "4", "3", "5", "2", "1"]
    assert page.evaluate("VLRuntimeInput.substitute(3, 8, false)") is True
    assert page.locator(".runtime-matrix-player").evaluate_all(
        "nodes => nodes.map(node => node.dataset.runtimeAuthor)"
    ) == ["7", "4", "8", "5", "2", "1"]
    assert events(page)[-1]["type"] == "SUBSTITUTION"
    assert errors == []
    page.close()


def test_flow_shows_player_action_and_shared_status_sections(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    assert page.locator(".runtime-flow-actions").count() == 1
    assert page.locator(".runtime-flow-players").count() == 1
    assert page.locator(".runtime-flow-status-grid").count() == 1
    assert page.locator('[data-runtime-action]').count() == 7
    assert page.locator('[data-runtime-action]:disabled').count() == 0
    assert page.locator('[data-runtime-result]:disabled').count() == 3
    page.locator('[data-runtime-action="reception"]').click()
    assert page.locator('[data-runtime-result="point"]').is_disabled()
    assert page.locator('[data-runtime-result="neutral"]').is_disabled()
    page.locator('[data-runtime-author="3"]').click()
    assert page.locator('[data-runtime-result="point"]').is_disabled()
    assert page.locator('[data-runtime-result="neutral"]').is_enabled()
    assert page.locator('[data-runtime-result="error"]').is_enabled()
    assert page.locator('[data-runtime-action="reception"]').get_attribute("aria-pressed") == "true"
    page.locator('[data-runtime-action="attack"]').click()
    assert page.locator('[data-runtime-result="point"]').is_enabled()
    assert page.locator('[data-runtime-result="neutral"]').is_enabled()
    assert page.locator('[data-runtime-result="error"]').is_enabled()
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-result="neutral"]').click()
    assert page.locator(".runtime-flow-last").inner_text() == (
        "Dernière action : #3 · Attaque · Continue"
    )
    assert errors == []
    page.close()


def test_flow1_matches_action_and_player_card_visuals(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 768, "height": 937})
    action_boxes = page.locator('[data-runtime-action]').evaluate_all(
        "nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.width, r.height]; })"
    )
    assert len(action_boxes) == 7
    assert all(abs(box[0] - action_boxes[0][0]) < 1 for box in action_boxes)
    assert all(abs(box[1] - action_boxes[0][1]) < 1 for box in action_boxes)
    assert page.locator('[data-runtime-action="freeball"]').evaluate(
        "node => getComputedStyle(node).gridRowStart"
    ) == "1"
    assert page.locator('[data-runtime-action="attack"]').evaluate(
        "node => getComputedStyle(node).gridRowStart"
    ) == "2"
    assert page.locator('[data-runtime-action="block"]').evaluate(
        "node => getComputedStyle(node).gridRowStart"
    ) == "3"
    assert page.locator('[data-runtime-action="service"]').evaluate(
        "node => getComputedStyle(node).gridRowStart"
    ) == "2"
    assert page.locator('[data-runtime-action="reception"]').evaluate(
        "node => getComputedStyle(node).gridRowStart"
    ) == "3"
    attack_offset = page.locator('[data-runtime-action="attack"]').evaluate(
        "node => node.getBoundingClientRect().top"
    ) - page.locator('[data-runtime-result="point"]').evaluate(
        "node => node.getBoundingClientRect().top"
    )
    block_offset = page.locator('[data-runtime-action="block"]').evaluate(
        "node => node.getBoundingClientRect().top"
    ) - page.locator('[data-runtime-result="neutral"]').evaluate(
        "node => node.getBoundingClientRect().top"
    )
    assert 50 <= attack_offset <= 60
    assert 50 <= block_offset <= 60
    assert page.locator('[data-runtime-result="point"]').evaluate(
        "node => getComputedStyle(node).gridColumnStart"
    ) == "3"
    status_boxes = page.locator('[data-runtime-result]').evaluate_all(
        "nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return [r.width, r.height]; })"
    )
    assert len(status_boxes) == 3
    assert all(abs(box[0] - action_boxes[0][0]) < 1 for box in status_boxes)
    assert all(abs(box[1] - action_boxes[0][1]) < 1 for box in status_boxes)
    assert page.locator('[data-runtime-result="point"] span').evaluate(
        "node => getComputedStyle(node).display"
    ) == "none"
    assert page.locator('[data-runtime-author="3"]').evaluate(
        "node => getComputedStyle(node).backgroundColor"
    ) == "rgb(255, 209, 214)"
    assert page.locator('[data-runtime-author="1"]').evaluate(
        "node => getComputedStyle(node).backgroundColor"
    ) == "rgb(255, 240, 168)"
    assert page.locator('[data-runtime-author="A"]').evaluate(
        "node => getComputedStyle(node).backgroundColor"
    ) == "rgb(0, 0, 0)"
    assert page.locator(".runtime-flow-player-bar").count() == 0
    assert page.locator(".runtime-error").evaluate(
        "node => getComputedStyle(node).display"
    ) == "none"
    footer_gap = page.locator(".runtime-footer").evaluate(
        "node => node.getBoundingClientRect().top - document.querySelector('.runtime-flow-players').getBoundingClientRect().bottom"
    )
    assert 60 <= footer_gap <= 75
    centered_bottom_row = page.locator('[data-runtime-action="set"]').evaluate(
        "set => { const defence = document.querySelector('[data-runtime-action=\"defense\"]'); const grid = document.querySelector('.runtime-flow-action-grid').getBoundingClientRect(); const left = set.getBoundingClientRect(); const right = defence.getBoundingClientRect(); return Math.abs((left.left + right.right) / 2 - (grid.left + grid.width / 2)); }"
    )
    assert centered_bottom_row < 1
    section_backgrounds = page.evaluate(
        "([getComputedStyle(document.querySelector('.runtime-flow-actions')).backgroundColor, getComputedStyle(document.querySelector('.runtime-flow-action-grid'), '::before').backgroundColor, getComputedStyle(document.querySelector('.runtime-flow-players')).backgroundColor])"
    )
    assert len(set(section_backgrounds)) == 3
    assert all(color != "rgba(0, 0, 0, 0)" for color in section_backgrounds)
    assert errors == []
    page.close()


def test_flow_allows_either_selection_order_and_toggles_selection(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 390, "height": 844})
    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-author="3"]').click()
    assert page.locator('[data-runtime-result="point"]').is_enabled()
    page.locator('[data-runtime-author="3"]').click()
    assert page.locator('[data-runtime-author="3"]').get_attribute("aria-pressed") == "false"
    assert page.locator('[data-runtime-result]').evaluate_all("nodes => nodes.every(node => node.disabled)")
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="attack"]').click()
    assert page.locator('[data-runtime-action="attack"]').get_attribute("aria-pressed") == "false"
    assert page.locator('[data-runtime-result]').evaluate_all("nodes => nodes.every(node => node.disabled)")
    page.locator('[data-runtime-undo]').click()
    assert page.locator('[data-runtime-author="3"]').get_attribute("aria-pressed") == "false"
    assert page.locator('[data-runtime-action="attack"]').get_attribute("aria-pressed") == "false"
    assert events(page) == []
    assert errors == []
    page.close()


def test_flow_opponent_can_record_point_or_error_without_an_action(browser):
    page, errors = open_runtime(browser, "FLOW", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="A"]').click()
    assert page.locator('[data-runtime-result="point"]').is_enabled()
    assert page.locator('[data-runtime-result="error"]').is_enabled()
    assert page.locator('[data-runtime-result="neutral"]').is_disabled()
    page.locator('[data-runtime-result="error"]').click()
    saved = events(page)
    assert len(saved) == 1
    assert saved[0]["authorSide"] == "AWAY"
    assert saved[0]["playerNumber"] is None
    assert saved[0]["action"] is None
    assert saved[0]["result"] == "error"
    assert saved[0]["scoreAfter"] == {"home": 1, "away": 0}
    page.locator('[data-runtime-author="3"]').click()
    assert page.evaluate("VLRuntimeInput.getState().author") == "3"
    assert errors == []
    page.close()


def test_action_grid_order_is_identical_in_all_modes(browser):
    expected = ["service", "reception", "set", "attack", "block", "defense", "freeball"]
    for mode, viewport in (("FOCUS", {"width": 390, "height": 844}), ("SPEED", {"width": 820, "height": 1000}), ("FLOW", {"width": 1180, "height": 820})):
        page, errors = open_runtime(browser, mode, viewport)
        if mode != "FLOW":
            page.locator('[data-runtime-author="3"]').click()
        order = page.locator('[data-runtime-action]').evaluate_all("nodes => nodes.map(n => n.dataset.runtimeAction)")
        assert order == (expected[:-1] if mode == "SPEED" else expected)
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
