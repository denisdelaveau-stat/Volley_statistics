"""v1.12 result-first capture, fixed geometry, compact libero bench and substitution filtering."""
from __future__ import annotations

import copy

import pytest

from helpers import APP_URI, base_match, events, open_match


def _boxes(page):
    selectors = [
        '[data-quick-action="freeball"]',
        '[data-quick-action="attack"]',
        '[data-quick-result="point"]',
        '[data-quick-action="service"]',
        '[data-quick-action="block"]',
        '[data-quick-result="error"]',
        '[data-quick-action="reception"]',
        '[data-quick-action="set"]',
        '.quick-middle',
        '[data-quick-action="defense"]',
    ] + [f'.court-grid [data-zone="{z}"]' for z in ('p4', 'p3', 'p2', 'p5', 'p6', 'p1')]
    return {selector: page.locator(selector).bounding_box() for selector in selectors}


def _rounded(boxes):
    return {
        key: {field: round(value, 2) for field, value in box.items()}
        for key, box in boxes.items()
    }


def test_result_first_layout_and_all_input_boxes_stay_fixed(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    assert page.get_by_text("SAISIE RAPIDE", exact=True).count() == 0
    assert page.locator("#quickMode").count() == 0
    assert page.locator(".quick-side-selector").is_hidden()
    assert page.locator("#courtStatus").is_hidden()
    assert page.locator("#phaseBadge").is_hidden()
    assert page.locator("#statsToggle").is_hidden()
    assert page.locator("#statsPanel").is_hidden()

    baseline = _rounded(_boxes(page))
    page.click('.court-grid [data-zone="p4"]')
    selected_player = _rounded(_boxes(page))
    page.click('[data-quick-action="block"]')
    selected_action = _rounded(_boxes(page))
    assert baseline == selected_player == selected_action
    assert "PROBABLE" not in page.locator('[data-quick-action="block"]').inner_text()

    page.evaluate("sessionStorage.setItem('volleyCapture.stage', 'capture')")
    page.reload()
    page.wait_for_timeout(100)
    before_result = _rounded(_boxes(page))
    continue_box = page.locator(".quick-middle").bounding_box()
    page.click('[data-quick-result="point"]')
    assert page.locator(".quick-side-selector").is_visible()
    pending_result = _rounded(_boxes(page))
    assert before_result == pending_result
    home = page.locator('[data-quick-side="T"]').bounding_box()
    away = page.locator('[data-quick-side="A"]').bounding_box()
    assert round(home["x"], 2) == round(continue_box["x"], 2)
    assert round(away["x"] + away["width"], 2) == round(continue_box["x"] + continue_box["width"], 2)
    assert round(home["y"], 2) == round(continue_box["y"], 2)
    assert round(away["y"] + away["height"], 2) == round(continue_box["y"] + continue_box["height"], 2)

    page.click('[data-quick-side="T"]')
    assert events(page)[-1]["player"] == "T"
    assert events(page)[-1]["result"] == "point"
    assert not errors
    page.close()


def _seed_setup_team(page):
    page.evaluate("""() => {
      localStorage.clear();
      localStorage.setItem('volleyCapture.library.v1', JSON.stringify({team:{
        'Antibes U18': {team:'Antibes U18', roster:[1,2,3,4,5,6,7,8], info:{
          1:{name:'Setter',pos:'setter'}, 2:{name:'Libero',pos:'libero'},
          3:{name:'OH 1',pos:'oh'}, 4:{name:'MB 1',pos:'mb'},
          5:{name:'OH 2',pos:'oh'}, 6:{name:'MB 2',pos:'mb'},
          7:{name:'Opposite',pos:'opp'}, 8:{name:'Reserve OH',pos:'oh'}
        }}
      }}));
    }""")


def test_initial_rotation_libero_bench_is_compact_centred_and_label_removed(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    _seed_setup_team(page)
    page.reload()
    page.click("#homeNew")
    page.select_option("#suTeamSelect", "Antibes U18")
    page.fill("#suOpp", "Nice")
    page.click("#suNext")
    page.click("#suNext")

    assert page.get_by_text("BANC LIBÉRO", exact=True).count() == 0
    bench = page.locator(".libero-bench").bounding_box()
    circle = page.locator(".libero-circle").bounding_box()
    court = page.locator(".setup-orange-court").bounding_box()
    assert 0 < bench["width"] - circle["width"] <= 16
    assert 0 < bench["height"] - circle["height"] <= 16
    assert circle["x"] >= bench["x"] and circle["x"] + circle["width"] <= bench["x"] + bench["width"]
    assert circle["y"] >= bench["y"] and circle["y"] + circle["height"] <= bench["y"] + bench["height"]
    assert abs((bench["x"] + bench["width"] / 2) - (court["x"] + court["width"] / 2)) < 2
    assert page.locator(".libero-seat-name").inner_text() == "SÉLECTIONNER LE LIBÉRO"
    page.locator(".libero-circle").click()
    assert page.locator('[data-lineup-player="2"]').is_visible()
    assert not errors
    page.close()


def _substitution_match(include_reserves=True):
    match = copy.deepcopy(base_match("advanced", focus_off=()))
    reserves = [
        {"number": 11, "name": "Reserve SET", "position": "setter", "present": True, "focus": True},
        {"number": 12, "name": "Reserve OH", "position": "oh", "present": True, "focus": True},
        {"number": 13, "name": "Reserve MB", "position": "mb", "present": True, "focus": True},
        {"number": 14, "name": "Reserve OPP", "position": "opp", "present": True, "focus": True},
        {"number": 15, "name": "Reserve LIB", "position": "libero", "present": True, "focus": True},
        {"number": 16, "name": "Absent OH", "position": "oh", "present": False, "focus": True},
    ]
    for row in match["team"]["roster"]:
        row["present"] = True
    if include_reserves:
        match["team"]["roster"].extend(reserves)
        match["team"]["players"] = list(range(1, 9)) + list(range(11, 16))
    return match


def _open_custom_match(browser, match):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    page.evaluate("""match => {
      localStorage.clear();
      localStorage.setItem('volleyCapture.match.v1', JSON.stringify(match));
      localStorage.setItem('volleyCapture.events.v1', '[]');
      localStorage.setItem('volleyCapture.chartData.v1', '[]');
      sessionStorage.setItem('volleyCapture.stage', 'capture');
    }""", match)
    page.reload()
    page.wait_for_timeout(100)
    return page, errors


@pytest.mark.parametrize(
    "out_number,expected_in,position",
    [(1, [11], "setter"), (3, [8, 12], "oh"), (4, [6, 13], "mb"), (7, [14], "opp"), (2, [15], "libero")],
)
def test_substitute_candidates_are_filtered_to_same_position(browser, out_number, expected_in, position):
    page, errors = _open_custom_match(browser, _substitution_match())
    page.click("#subToggle")
    page.click(f'.court-grid [data-player="{out_number}"]')
    offered = [int(value) for value in page.locator("[data-in]").evaluate_all("es => es.map(e => e.dataset.in)")]
    assert offered == expected_in
    assert 5 not in offered  # an on-court OH is never offered
    assert 16 not in offered  # the absent OH is never offered
    assert not errors
    page.close()


def test_substitute_empty_state_and_logged_undo(browser):
    no_reserve = _substitution_match(include_reserves=False)
    page, errors = _open_custom_match(browser, no_reserve)
    page.click("#subToggle")
    page.click('.court-grid [data-player="1"]')
    assert page.locator("[data-in]").count() == 0
    assert page.get_by_text("Aucun remplaçant disponible à ce poste", exact=True).is_visible()
    page.close()

    page, errors = _open_custom_match(browser, _substitution_match())
    page.click("#subToggle")
    page.click('.court-grid [data-player="3"]')
    page.click('[data-in="12"]')
    log = events(page)
    assert len(log) == 1
    event = log[0]
    assert event["type"] == "SUBSTITUTION"
    assert (event["playerOut"], event["playerIn"], event["position"], event["set"], event["rally"]) == (3, 12, "oh", 1, 1)
    match = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
    assert match["subs"][-1]["eventId"] == event["id"]
    page.click("#captureUndo")
    assert events(page) == []
    match = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
    assert match["subs"] == []
    assert not errors
    page.close()
