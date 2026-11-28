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
    mode_tabs = page.locator(".runtime-mode-tabs")
    assert mode_tabs.is_visible()
    assert mode_tabs.locator('[data-runtime-mode="GAMEPAD"]').get_attribute("aria-pressed") == "true"
    mode_tabs.locator('[data-runtime-mode="FLOW"]').click()
    assert page.locator("html").get_attribute("data-runtime-mode") == "FLOW"
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
    assert page.locator('.gamepad-player-circle [aria-pressed="true"]').count() == 0
    assert page.locator('.gamepad-action-circle [aria-pressed="true"]').count() == 0
    wheel_backgrounds = page.evaluate("""() => ({
      players: getComputedStyle(document.querySelector('.gamepad-player-circle')).backgroundColor,
      actions: getComputedStyle(document.querySelector('.gamepad-action-circle')).backgroundColor,
      results: getComputedStyle(document.querySelector('.gamepad-inline-status')).backgroundColor,
      playerSector: getComputedStyle(document.querySelector('.gamepad-player-circle [data-gamepad-player="0"] path')).fill,
      actionSector: getComputedStyle(document.querySelector('.gamepad-action-circle [data-gamepad-action="attack"] path')).fill,
      relance: getComputedStyle(document.querySelector('.gamepad-action-center circle')).fill
    })""")
    assert wheel_backgrounds == {
        "players": "rgba(32, 199, 102, 0.32)",
        "actions": "rgba(13, 54, 93, 0.72)",
        "results": "rgba(155, 114, 243, 0.56)",
        "playerSector": "rgb(207, 234, 250)",
        "actionSector": "color(srgb 0.964706 0.646667 0.676863)",
        "relance": "rgb(255, 240, 168)",
    }
    player_number_size = page.locator('.gamepad-player-circle .gamepad-touch-sector text').first.evaluate(
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
    opponent = page.locator('.gamepad-touch-center[data-gamepad-player="A"]')
    assert opponent.get_attribute("aria-pressed") == "true"
    assert opponent.evaluate("node => getComputedStyle(node.querySelector('circle')).strokeWidth") == "12px"
    page.locator('.gamepad-touch-center[data-gamepad-action="freeball"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().action") == "freeball"
    relance = page.locator('.gamepad-touch-center[data-gamepad-action="freeball"]')
    assert relance.get_attribute("aria-pressed") == "true"
    assert relance.evaluate("node => getComputedStyle(node.querySelector('circle')).strokeWidth") == "12px"
    page.locator('.gamepad-touch-sector[data-gamepad-player="0"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().author") != "A"
    selected_players = page.locator('.gamepad-player-circle .gamepad-touch-sector[aria-pressed="true"]')
    assert selected_players.count() == 1
    assert selected_players.first.evaluate("node => getComputedStyle(node.querySelector('path')).strokeWidth") == "12px"
    page.locator('.gamepad-touch-sector[data-gamepad-action="attack"]').click()
    assert page.evaluate("window.VLRuntimeInput.getState().action") == "attack"
    selected_actions = page.locator('.gamepad-action-circle .gamepad-touch-sector[aria-pressed="true"]')
    assert selected_actions.count() == 1
    assert selected_actions.first.evaluate("node => getComputedStyle(node.querySelector('path')).strokeWidth") == "12px"
    page.locator('.gamepad-inline-status [data-gamepad-status="positive"]').click()
    page.wait_for_timeout(30)
    recorded = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1'))")
    assert recorded[-1]["inputSource"] == "touch"
    assert page.locator('#gamepadCaptureOverlay').is_hidden()
    assert page.locator('.gamepad-player-circle [aria-pressed="true"]').count() == 0
    assert page.locator('.gamepad-action-circle [aria-pressed="true"]').count() == 0
    wheel_width = page.locator('.gamepad-player-circle').evaluate("(element) => element.getBoundingClientRect().width")
    status_width = page.locator('div.gamepad-inline-status').evaluate(
        "(element) => element.getBoundingClientRect().width"
    )
    assert 340 <= wheel_width <= 360
    assert 180 <= status_width <= 200
    assert errors == []
    page.close()


def test_runtime_options_are_available_and_persisted(browser):
    page, errors = open_runtime(browser)
    assert page.locator('[data-runtime-mode="SPEED"]').inner_text() == "BOARD"
    assert page.locator('[data-runtime-mode="FLOW"]').inner_text() == "CARDS"
    page.locator('[data-runtime-options]').click()
    assert page.locator('[data-runtime-pref-mode]').count() == 4
    assert page.locator('[data-runtime-pref-mode="SPEED"]').inner_text() == "BOARD"
    assert page.locator('[data-runtime-pref-mode="FLOW"]').inner_text() == "CARDS"
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
    assert "Qui joue ?" not in page.locator(".runtime-question").inner_text()
    assert page.locator(".runtime-kicker").inner_text() == "1 · JOUEUR"
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


def test_focus_opponent_is_seventh_tile_matching_player_dimensions(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    assert page.locator(".runtime-player").count() == 7
    assert page.locator(".runtime-opponent-tile").count() == 1
    tile_geometry = page.evaluate("""() => {
      const bounds = selector => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return {width: rect.width, height: rect.height, centerX: rect.left + rect.width / 2};
      };
      return {
        player: bounds('.runtime-player:not(.runtime-opponent-tile)'),
        opponent: bounds('.runtime-opponent-tile'),
        grid: bounds('.runtime-player-grid')
      };
    }""")
    assert tile_geometry["opponent"]["width"] == tile_geometry["player"]["width"]
    assert tile_geometry["opponent"]["height"] == tile_geometry["player"]["height"]
    assert abs(tile_geometry["opponent"]["centerX"] - tile_geometry["grid"]["centerX"]) < 1
    assert errors == []
    page.close()


def test_focus_steps_keep_buttons_at_the_same_page_position(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})

    def layout():
        page.wait_for_timeout(120)
        return page.evaluate("""() => {
          const rect = selector => {
            const bounds = document.querySelector(selector).getBoundingClientRect();
            return {top: bounds.top, height: bounds.height};
          };
          return {
            question: rect('.runtime-question'),
            panel: rect('.runtime-panel'),
            buttons: rect('.runtime-player-grid, .runtime-action-grid, .runtime-result-grid'),
            footer: rect('.runtime-footer'),
            pageHeight: document.documentElement.scrollHeight
          };
        }""")

    layouts = [layout()]
    page.locator('[data-runtime-author="3"]').click()
    layouts.append(layout())
    page.locator('[data-runtime-action="attack"]').click()
    layouts.append(layout())

    for key in ("question", "panel", "footer"):
        for layout_state in layouts[1:]:
            assert abs(layout_state[key]["top"] - layouts[0][key]["top"]) < 1
            assert abs(layout_state[key]["height"] - layouts[0][key]["height"]) < 1
    assert abs(layouts[1]["buttons"]["top"] - layouts[0]["buttons"]["top"]) < 1
    assert layouts[1]["pageHeight"] == layouts[0]["pageHeight"]
    assert layouts[2]["pageHeight"] == layouts[0]["pageHeight"]
    assert events(page) == []
    assert errors == []
    page.close()


def test_focus_action_and_status_buttons_match_player_dimensions(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    player_button = page.locator(".runtime-player:not(.runtime-opponent-tile)").first
    player_dimensions = player_button.evaluate(
        """node => {
          const rect = node.getBoundingClientRect();
          return {width: rect.width, height: rect.height};
        }"""
    )
    page.locator('[data-runtime-author="3"]').click()
    action_dimensions = page.locator(".runtime-action").first.evaluate(
        """node => {
          const rect = node.getBoundingClientRect();
          return {width: rect.width, height: rect.height};
        }"""
    )
    page.locator('[data-runtime-action="attack"]').click()
    geometry = page.evaluate("""() => {
      const bounds = node => {
        const rect = node.getBoundingClientRect();
        return {top: rect.top, width: rect.width, height: rect.height};
      };
      const panel = bounds(document.querySelector('.runtime-panel'));
      const statusGrid = bounds(document.querySelector('.runtime-result-grid'));
      const statusButton = document.querySelector('.runtime-result');
      return {
        panel,
        statusGrid,
        statusButton: bounds(statusButton)
      };
    }""")
    panel_center = geometry["panel"]["top"] + geometry["panel"]["height"] / 2
    status_center = geometry["statusGrid"]["top"] + geometry["statusGrid"]["height"] / 2
    assert abs(status_center - panel_center) < 12
    for dimensions in (action_dimensions, geometry["statusButton"]):
        assert abs(dimensions["width"] - player_dimensions["width"]) < 1
        assert abs(dimensions["height"] - player_dimensions["height"]) < 1
    assert errors == []
    assert events(page) == []
    page.close()


def test_focus_relance_matches_other_action_button_dimensions_and_is_centered(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="3"]').click()
    page.wait_for_timeout(120)
    geometry = page.evaluate("""() => {
      const bounds = node => {
        const rect = node.getBoundingClientRect();
        return {left: rect.left, width: rect.width, height: rect.height};
      };
      return {
        grid: bounds(document.querySelector('.runtime-action-grid')),
        buttons: Array.from(document.querySelectorAll('.runtime-action'), bounds),
        relance: bounds(document.querySelector('[data-runtime-action="freeball"]'))
      };
    }""")
    assert len(geometry["buttons"]) == 7
    for button in geometry["buttons"]:
        assert abs(button["width"] - geometry["relance"]["width"]) < 1
        assert abs(button["height"] - geometry["relance"]["height"]) < 1
    relance_center = geometry["relance"]["left"] + geometry["relance"]["width"] / 2
    grid_center = geometry["grid"]["left"] + geometry["grid"]["width"] / 2
    assert abs(relance_center - grid_center) < 1
    assert errors == []
    assert events(page) == []
    page.close()


def test_focus_actions_are_arranged_in_vertical_pairs_with_relance_below(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="3"]').click()
    page.wait_for_timeout(120)
    geometry = page.evaluate("""() => {
      const bounds = node => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          bottom: rect.bottom,
          centerX: (rect.left + rect.right) / 2
        };
      };
      return {
        grid: bounds(document.querySelector('.runtime-action-grid')),
        buttons: Object.fromEntries(
          ['service', 'reception', 'block', 'attack', 'set', 'defense', 'freeball']
            .map(id => [id, bounds(document.querySelector(`[data-runtime-action="${id}"]`))])
        )
      };
    }""")

    for upper, lower in (
        ("service", "reception"),
        ("block", "attack"),
        ("set", "defense"),
    ):
        assert abs(geometry["buttons"][upper]["centerX"] - geometry["buttons"][lower]["centerX"]) < 1
        assert geometry["buttons"][lower]["top"] > geometry["buttons"][upper]["top"]
    assert (
        geometry["buttons"]["service"]["centerX"]
        < geometry["buttons"]["block"]["centerX"]
        < geometry["buttons"]["set"]["centerX"]
    )
    assert geometry["buttons"]["freeball"]["top"] > max(
        geometry["buttons"][action]["bottom"]
        for action in ("reception", "attack", "defense")
    )
    assert abs(
        geometry["buttons"]["freeball"]["centerX"] - geometry["grid"]["centerX"]
    ) < 1
    assert errors == []
    assert events(page) == []
    page.close()


def test_focus_middle_button_row_is_present_and_aligned_across_steps(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})

    def button_rows(selector):
        page.wait_for_timeout(120)
        return page.evaluate(
            """selector => {
              const rows = [];
              for (const node of document.querySelectorAll(selector)) {
                const rect = node.getBoundingClientRect();
                let row = rows.find(candidate => Math.abs(candidate.top - rect.top) < 1);
                if (!row) {
                  row = {top: rect.top, centerYs: [], centerXs: [], visible: true};
                  rows.push(row);
                }
                row.centerYs.push((rect.top + rect.bottom) / 2);
                row.centerXs.push((rect.left + rect.right) / 2);
                row.visible = row.visible && rect.width > 0 && rect.height > 0;
              }
              return rows
                .sort((left, right) => left.top - right.top)
                .map(row => ({
                  centerY: row.centerYs.reduce((sum, center) => sum + center, 0) / row.centerYs.length,
                  centerXs: row.centerXs.sort((left, right) => left - right),
                  count: row.centerXs.length,
                  visible: row.visible
                }));
            }""",
            selector,
        )

    player_rows = button_rows(".runtime-player")
    page.locator('[data-runtime-author="3"]').click()
    action_rows = button_rows(".runtime-action")
    page.locator('[data-runtime-action="attack"]').click()
    status_rows = button_rows(".runtime-result")

    assert len(player_rows) == 3 and player_rows[1]["count"] == 3
    assert len(action_rows) == 3 and action_rows[1]["count"] == 3
    assert len(status_rows) == 1 and status_rows[0]["count"] == 3
    middle_rows = (player_rows[1], action_rows[1], status_rows[0])
    assert all(row["visible"] for row in middle_rows)
    assert max(row["centerY"] for row in middle_rows) - min(
        row["centerY"] for row in middle_rows
    ) < 1
    for column in range(3):
        centers = [row["centerXs"][column] for row in middle_rows]
        assert max(centers) - min(centers) < 1

    assert errors == []
    assert events(page) == []
    page.close()


def test_status_button_colors_match_focus_across_modes(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="3"]').click()
    page.locator('[data-runtime-action="attack"]').click()

    def colors(selectors):
        return page.evaluate(
            """selectors => Object.fromEntries(Object.entries(selectors).map(([name, selector]) => {
              const style = getComputedStyle(document.querySelector(selector));
              return [name, [style.backgroundImage, style.borderColor, style.color]];
            }))""",
            selectors,
        )

    expected = colors({
        "positive": ".runtime-result.positive",
        "neutral": ".runtime-result.neutral",
        "error": ".runtime-result.error",
    })
    for mode, selectors in (
        ("SPEED", {
            "positive": ".runtime-matrix-status.positive",
            "neutral": ".runtime-matrix-status.neutral",
            "error": ".runtime-matrix-status.error",
        }),
        ("FLOW", {
            "positive": ".runtime-flow-status.positive",
            "neutral": ".runtime-flow-status.neutral",
            "error": ".runtime-flow-status.error",
        }),
        ("GAMEPAD", {
            "positive": ".gamepad-inline-status .positive",
            "neutral": ".gamepad-inline-status .neutral",
            "error": ".gamepad-inline-status .negative",
        }),
    ):
        page.locator(f'[data-runtime-mode="{mode}"]').click()
        assert colors(selectors) == expected

    assert errors == []
    assert events(page) == []
    page.close()


def test_player_role_colors_match_focus_across_modes(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    focus_colors = page.locator(".runtime-player:not(.runtime-opponent-tile)").evaluate_all(
        """nodes => Object.fromEntries(nodes.map(node => {
          const style = getComputedStyle(node);
          return [node.dataset.runtimeAuthor, [style.backgroundColor, style.color]];
        }))"""
    )
    assert len(focus_colors) == 6

    page.locator('[data-runtime-mode="SPEED"]').click()
    matrix_colors = page.locator(".runtime-matrix-player").evaluate_all(
        """nodes => Object.fromEntries(nodes.map(node => {
          const style = getComputedStyle(node);
          return [node.dataset.runtimeAuthor, [style.backgroundColor, style.color]];
        }))"""
    )
    assert matrix_colors == focus_colors

    page.locator('[data-runtime-mode="FLOW"]').click()
    flow_colors = page.locator(".runtime-flow-player:not(.runtime-flow-opponent)").evaluate_all(
        """nodes => Object.fromEntries(nodes.map(node => {
          const style = getComputedStyle(node);
          return [node.dataset.runtimeAuthor, [style.backgroundColor, style.color]];
        }))"""
    )
    assert flow_colors == focus_colors

    page.locator('[data-runtime-mode="GAMEPAD"]').click()
    gamepad_colors = page.locator(
        ".gamepad-player-circle .gamepad-touch-sector[data-gamepad-player]"
    ).evaluate_all(
        """nodes => Object.fromEntries(nodes.map(node => [
          node.textContent.trim(),
          [
            getComputedStyle(node.querySelector('path')).fill,
            getComputedStyle(node.querySelector('text')).fill
          ]
        ]))"""
    )
    assert gamepad_colors == focus_colors
    assert errors == []
    page.close()


def test_action_colors_match_across_input_modes_with_paired_tones(browser):
    page, errors = open_runtime(browser, "FOCUS", {"width": 1180, "height": 820})
    page.locator('[data-runtime-author="3"]').click()
    focus_colors = page.locator(".runtime-action").evaluate_all(
        "nodes => Object.fromEntries(nodes.map(node => [node.dataset.runtimeAction, getComputedStyle(node).backgroundColor]))"
    )
    color_details = page.locator(".runtime-action").evaluate_all(
        """nodes => Object.fromEntries(nodes.map(node => {
          const style = getComputedStyle(node);
          return [node.dataset.runtimeAction, {
            background: style.backgroundColor,
            border: style.borderTopColor,
            text: style.color
          }];
        }))"""
    )

    for upper, lower in (
        ("service", "reception"),
        ("block", "attack"),
        ("set", "defense"),
    ):
        assert color_details[upper]["border"] == color_details[lower]["border"]
        assert color_details[upper]["text"] == color_details[lower]["text"]
        assert color_details[upper]["background"] != color_details[lower]["background"]

    pair_colors = [color_details[action]["border"] for action in ("service", "block", "set", "freeball")]
    assert len(set(pair_colors)) == 4

    page.locator('[data-runtime-mode="SPEED"]').click()
    matrix_colors = page.locator(".runtime-matrix-action").evaluate_all(
        "nodes => Object.fromEntries(nodes.map(node => [node.dataset.runtimeAction, getComputedStyle(node).backgroundColor]))"
    )
    assert matrix_colors == {action: focus_colors[action] for action in matrix_colors}

    page.locator('[data-runtime-mode="FLOW"]').click()
    flow_colors = page.locator(".runtime-flow-action").evaluate_all(
        "nodes => Object.fromEntries(nodes.map(node => [node.dataset.runtimeAction, getComputedStyle(node).backgroundColor]))"
    )
    assert flow_colors == focus_colors

    page.locator('[data-runtime-mode="GAMEPAD"]').click()
    gamepad_colors = page.locator(".gamepad-action-circle .gamepad-touch-sector[data-gamepad-action]").evaluate_all(
        """nodes => Object.fromEntries(nodes.map(node => [
          node.dataset.gamepadAction,
          getComputedStyle(node.querySelector('path')).fill
        ]))"""
    )
    gamepad_colors["freeball"] = page.locator(".gamepad-action-center circle").evaluate(
        "node => getComputedStyle(node).fill"
    )
    assert gamepad_colors == focus_colors

    assert errors == []
    assert events(page) == []
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
    assert abs(opponent_shape["height"] - (3 * player_shape["height"] + 12)) < 1
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
    ) == ["service", "reception", "block", "attack", "set", "defense", "freeball"]
    assert page.locator('[data-runtime-result]:disabled').count() == 3

    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-author="3"]').click()
    assert page.evaluate("VLRuntimeInput.getState().author") == "3"
    assert page.evaluate("VLRuntimeInput.getState().action") == "attack"
    selected_player = page.locator(".runtime-matrix-player.selected")
    selected_action = page.locator(".runtime-matrix-action.selected")
    assert selected_player.count() == 1
    assert selected_action.count() == 1
    assert "preferred" in selected_action.get_attribute("class").split()
    for button in (selected_player, selected_action):
        assert button.get_attribute("aria-pressed") == "true"
        assert button.evaluate("node => getComputedStyle(node).outlineWidth") == "3px"
        assert button.evaluate("node => getComputedStyle(node).outlineColor") == "rgb(255, 255, 255)"
    assert page.locator('[data-runtime-result="point"]').is_enabled()
    page.locator('[data-runtime-result="point"]').click()
    assert events(page)[-1]["actionCode"] == "ATTACK"
    assert page.evaluate("VLRuntimeInput.getState().author") is None
    assert page.evaluate("VLRuntimeInput.getState().action") is None
    assert page.locator(".runtime-matrix-player.selected, .runtime-matrix-action.selected").count() == 0

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

    page.locator('[data-runtime-action="freeball"]').click()
    page.locator('[data-runtime-author="3"]').click()
    assert page.evaluate("VLRuntimeInput.getState().action") == "freeball"
    assert page.locator('[data-runtime-result="point"]').is_disabled()
    assert page.locator('[data-runtime-result="neutral"]').is_enabled()
    assert page.locator('[data-runtime-result="error"]').is_enabled()
    page.locator('[data-runtime-undo]').click()
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
    assert abs(vertical_shapes["opponent"]["height"] - (3 * vertical_shapes["player"]["height"] + 12)) < 1
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


def test_cards_opponent_width_matches_player_button_height(browser):
    for viewport in ({"width": 1180, "height": 820}, {"width": 390, "height": 844}):
        page, errors = open_runtime(browser, "FLOW", viewport)
        dimensions = page.evaluate("""() => {
          const player = document.querySelector('.runtime-flow-player:not(.runtime-flow-opponent)').getBoundingClientRect();
          const opponent = document.querySelector('.runtime-flow-opponent').getBoundingClientRect();
          const playerNumber = document.querySelector('.runtime-flow-player:not(.runtime-flow-opponent) b');
          const opponentLabel = document.querySelector('.runtime-flow-opponent b');
          return {
            playerHeight: player.height,
            opponentWidth: opponent.width,
            playerFontSize: getComputedStyle(playerNumber).fontSize,
            opponentFontSize: getComputedStyle(opponentLabel).fontSize
          };
        }""")
        assert abs(dimensions["opponentWidth"] - dimensions["playerHeight"]) < 1
        assert dimensions["opponentFontSize"] == dimensions["playerFontSize"]
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


def test_action_order_matches_each_mode_layout(browser):
    cases = (
        ("FOCUS", {"width": 390, "height": 844}, ["service", "block", "set", "reception", "attack", "defense", "freeball"]),
        ("SPEED", {"width": 1180, "height": 820}, ["service", "reception", "block", "attack", "set", "defense", "freeball"]),
        ("SPEED", {"width": 820, "height": 1000}, ["service", "reception", "block", "attack", "set", "defense", "freeball"]),
        ("FLOW", {"width": 1180, "height": 820}, ["service", "reception", "set", "attack", "block", "defense", "freeball"]),
    )
    for mode, viewport, expected in cases:
        page, errors = open_runtime(browser, mode, viewport)
        if mode != "FLOW":
            page.locator('[data-runtime-author="3"]').click()
        order = page.locator('[data-runtime-action]').evaluate_all("nodes => nodes.map(n => n.dataset.runtimeAction)")
        assert order == expected
        assert errors == []
        page.close()


def test_non_focus_selections_stay_highlighted_until_status(browser):
    for mode, viewport, player_selector, action_selector in (
        ("SPEED", {"width": 1180, "height": 820}, ".runtime-matrix-player.selected", ".runtime-matrix-action.selected"),
        ("FLOW", {"width": 1180, "height": 820}, ".runtime-flow-player.selected", ".runtime-flow-action.selected"),
    ):
        page, errors = open_runtime(browser, mode, viewport)
        page.locator('[data-runtime-author="3"]').click()
        page.locator('[data-runtime-action="attack"]').click()
        player = page.locator(player_selector)
        action = page.locator(action_selector)
        assert player.count() == 1
        assert action.count() == 1
        assert "preferred" in action.get_attribute("class").split()
        assert action.evaluate("node => getComputedStyle(node).boxShadow") != "none"
        for button in (player, action):
            assert button.get_attribute("aria-pressed") == "true"
            assert button.evaluate("node => getComputedStyle(node).outlineWidth") == "3px"
            assert button.evaluate("node => getComputedStyle(node).outlineColor") == "rgb(255, 255, 255)"

        page.locator('[data-runtime-result="point"]').click()
        assert page.evaluate("VLRuntimeInput.getState().author") is None
        assert page.evaluate("VLRuntimeInput.getState().action") is None
        assert page.locator(f"{player_selector}, {action_selector}").count() == 0
        assert errors == []
        page.close()


def test_speed_matrix_buttons_share_dimensions_and_action_groups_are_centered(browser):
    page, errors = open_runtime(browser, "SPEED", {"width": 1180, "height": 820})

    def measure():
        return page.evaluate("""() => {
          const bounds = node => {
            const rect = node.getBoundingClientRect();
            return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};
          };
          return {
            layout: document.querySelector('.runtime-matrix').className,
            groups: ['.runtime-matrix-player-grid', '.runtime-matrix-action-grid', '.runtime-matrix-status-grid']
              .map(selector => bounds(document.querySelector(selector))),
            buttons: Array.from(document.querySelectorAll(
              '.runtime-matrix-player, .runtime-matrix-opponent, .runtime-matrix-action, .runtime-matrix-status'
            )).map(node => ({
              id: node.dataset.runtimeAction || node.dataset.runtimeAuthor,
              ...bounds(node),
              clientWidth: node.clientWidth,
              clientHeight: node.clientHeight,
              scrollHeight: node.scrollHeight,
              whiteSpace: getComputedStyle(node).whiteSpace,
              writingMode: getComputedStyle(node).writingMode
            }))
          };
        }""")

    def assert_button_spans_three_rows(snapshot, spanning_button, member_ids):
        members = [button for button in snapshot["buttons"] if button.get("id") in member_ids]
        rows = {}
        for member in members:
            rows.setdefault(round(member["y"], 1), []).append(member)
        assert len(rows) == 3
        assert all(len(row) == 2 for row in rows.values())
        assert len({round(member["x"], 1) for member in members}) == 2
        first_row_y = min(rows)
        right_edge = max(member["x"] + member["width"] for member in rows[first_row_y])
        assert abs(spanning_button["x"] - right_edge - 6) < 1
        assert abs(spanning_button["y"] - first_row_y) < 1

    horizontal = measure()
    assert "runtime-matrix-horizontal-" in horizontal["layout"]
    assert len(horizontal["buttons"]) == 17
    horizontal_opponent = next(button for button in horizontal["buttons"] if button["id"] == "A")
    horizontal_freeball = next(button for button in horizontal["buttons"] if button["id"] == "freeball")
    horizontal_standard = [
        button for button in horizontal["buttons"] if button.get("id") not in {"A", "freeball"}
    ]
    assert all(
        abs(button["width"] - horizontal_standard[0]["width"]) < 1
        and abs(button["height"] - horizontal_standard[0]["height"]) < 1
        for button in horizontal_standard
    )
    assert abs(horizontal_opponent["width"] - horizontal_standard[0]["height"]) < 1
    assert abs(horizontal_opponent["height"] - (3 * horizontal_standard[0]["height"] + 12)) < 1
    assert abs(horizontal_freeball["width"] - horizontal_standard[0]["height"]) < 1
    assert abs(horizontal_freeball["height"] - (3 * horizontal_standard[0]["height"] + 12)) < 1
    assert horizontal_freeball["whiteSpace"] == "nowrap"
    assert horizontal_freeball["writingMode"] == "vertical-rl"
    assert horizontal_freeball["scrollHeight"] <= horizontal_freeball["clientHeight"]
    player_ids = {
        button["id"]
        for button in horizontal["buttons"]
        if button.get("id") and button["id"].isdigit()
    }
    action_ids = {"service", "reception", "block", "attack", "set", "defense"}
    assert_button_spans_three_rows(horizontal, horizontal_opponent, player_ids)
    assert_button_spans_three_rows(horizontal, horizontal_freeball, action_ids)
    horizontal_centers = [group["y"] + group["height"] / 2 for group in horizontal["groups"]]
    assert max(horizontal_centers) - min(horizontal_centers) < 1
    assert (
        max(group["height"] for group in horizontal["groups"])
        - min(group["height"] for group in horizontal["groups"])
        < 1
    )
    horizontal_actions = {
        button["id"]: button
        for button in horizontal["buttons"]
        if button["id"] in {"service", "reception", "block", "attack", "set", "defense"}
    }
    for first, second in (("service", "reception"), ("block", "attack"), ("set", "defense")):
        assert abs(horizontal_actions[first]["y"] - horizontal_actions[second]["y"]) < 1

    page.set_viewport_size({"width": 820, "height": 1000})
    page.wait_for_selector(".runtime-matrix-vertical-down, .runtime-matrix-vertical-up")
    vertical = measure()
    assert "runtime-matrix-vertical-" in vertical["layout"]
    vertical_opponent = next(button for button in vertical["buttons"] if button["id"] == "A")
    vertical_freeball = next(button for button in vertical["buttons"] if button["id"] == "freeball")
    vertical_standard = [
        button for button in vertical["buttons"] if button.get("id") not in {"A", "freeball"}
    ]
    assert all(
        abs(button["width"] - vertical_standard[0]["width"]) < 1
        and abs(button["height"] - vertical_standard[0]["height"]) < 1
        for button in vertical_standard
    )
    assert abs(vertical_opponent["width"] - vertical_standard[0]["height"]) < 1
    assert abs(vertical_opponent["height"] - (3 * vertical_standard[0]["height"] + 12)) < 1
    assert abs(vertical_freeball["width"] - vertical_standard[0]["height"]) < 1
    assert abs(vertical_freeball["height"] - (3 * vertical_standard[0]["height"] + 12)) < 1
    assert vertical_freeball["whiteSpace"] == "nowrap"
    assert vertical_freeball["writingMode"] == "vertical-rl"
    assert vertical_freeball["scrollHeight"] <= vertical_freeball["clientHeight"]
    vertical_player_ids = {
        button["id"]
        for button in vertical["buttons"]
        if button.get("id") and button["id"].isdigit()
    }
    assert_button_spans_three_rows(vertical, vertical_opponent, vertical_player_ids)
    assert_button_spans_three_rows(vertical, vertical_freeball, action_ids)
    vertical_centers = [group["x"] + group["width"] / 2 for group in vertical["groups"]]
    assert max(vertical_centers) - min(vertical_centers) < 1
    assert (
        max(group["height"] for group in vertical["groups"])
        - min(group["height"] for group in vertical["groups"])
        < 1
    )
    vertical_actions = {
        button["id"]: button
        for button in vertical["buttons"]
        if button["id"] in {"service", "reception", "block", "attack", "set", "defense"}
    }
    for first, second in (("service", "reception"), ("block", "attack"), ("set", "defense")):
        assert abs(vertical_actions[first]["y"] - vertical_actions[second]["y"]) < 1

    assert page.locator('[data-runtime-action="freeball"]').count() == 1
    page.set_viewport_size({"width": 1180, "height": 500})
    page.wait_for_timeout(100)
    compact = measure()
    compact_standard = [
        button for button in compact["buttons"] if button.get("id") not in {"A", "freeball"}
    ]
    compact_opponent = next(button for button in compact["buttons"] if button["id"] == "A")
    compact_freeball = next(button for button in compact["buttons"] if button["id"] == "freeball")
    assert abs(compact_opponent["width"] - compact_standard[0]["height"]) < 1
    assert abs(compact_freeball["width"] - compact_standard[0]["height"]) < 1
    assert compact_freeball["whiteSpace"] == "nowrap"
    assert compact_freeball["writingMode"] == "vertical-rl"
    assert compact_freeball["scrollHeight"] <= compact_freeball["clientHeight"]
    assert errors == []
    assert events(page) == []
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
