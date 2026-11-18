"""Acceptance coverage for the nine Modification UI 5 refinements in v1.6.8."""

from helpers import open_match, wait_guard


def _style(locator, properties):
    return locator.evaluate(
        "(e, ps) => Object.fromEntries(ps.map(p => [p, getComputedStyle(e)[p]]))",
        properties,
    )


def test_live_compaction_rotation_spacing_phase_net_undo_and_history(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))

    score = page.locator("#liveScore").bounding_box()
    rotation = page.locator("#courtStatus").bounding_box()
    phase = page.locator("#phaseBadge").bounding_box()
    upper_gap = rotation["y"] - (score["y"] + score["height"])
    lower_gap = phase["y"] - (rotation["y"] + rotation["height"])
    assert abs(upper_gap - lower_gap) <= 1.5
    assert page.locator("#courtStatus").inner_text() == "Rot. P1 | R1 | C1"

    net_style = _style(page.locator(".vlc-net"), ["height", "borderTopWidth", "backgroundImage"])
    assert net_style["height"] == "28px"
    assert net_style["borderTopWidth"] == "5px"
    assert "linear-gradient" in net_style["backgroundImage"]

    undo_style = _style(page.locator("#captureUndo"), ["backgroundColor", "borderColor", "color"])
    assert undo_style == {
        "backgroundColor": "rgb(254, 215, 170)",
        "borderColor": "rgb(251, 146, 60)",
        "color": "rgb(154, 52, 18)",
    }

    assert 70 <= page.locator(".vlc-result-bar.team").bounding_box()["height"] <= 73
    assert 59 <= page.locator(".vlc-result-bar.opp").bounding_box()["height"] <= 64

    page.click('[data-vlc-actor="A"] [data-vlc-result="point"]')
    phase_style = _style(page.locator("#phaseBadge"), ["backgroundColor", "color"])
    assert page.locator("#phaseBadge").inner_text() == "RECEPTION"
    assert phase_style == {"backgroundColor": "rgb(37, 99, 235)", "color": "rgb(255, 255, 255)"}
    assert page.locator("#phaseBadge").bounding_box()["height"] < 32

    assert page.locator(".history thead th").all_inner_texts() == ["#", "Player", "Action", "Result", "Score"]
    assert page.locator("#captureHistory tr").first.locator("td").count() == 5
    assert not errors
    page.close()


def test_advanced_semantic_action_colours_keep_rare_rows_lighter(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))
    page.click('.court-grid [data-zone="p2"]')  # OH

    expected = {
        "attack": "rgb(255, 237, 213)",
        "block": "rgb(255, 237, 213)",
        "defense": "rgb(220, 252, 231)",
        "reception": "rgb(220, 252, 231)",
        "service": "rgb(219, 234, 254)",
        "set": "rgb(219, 234, 254)",
    }
    for action, colour in expected.items():
        row = page.locator(f'[data-adv-row="{action}"]')
        assert row.locator(".vlc-action-name").evaluate("e => getComputedStyle(e).backgroundColor") == colour

    rare = page.locator('[data-adv-row="set"]')
    expected_row = page.locator('[data-adv-row="attack"]')
    assert float(rare.evaluate("e => getComputedStyle(e).opacity")) < float(
        expected_row.evaluate("e => getComputedStyle(e).opacity")
    )
    assert not errors
    page.close()
