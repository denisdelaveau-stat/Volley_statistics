"""SPECTATOR VIEW v1.26.0: shared set navigation, role colours, and compact Timeline."""
from __future__ import annotations

from test_score_fault_evolution_v1_18 import two_set_fixture
from test_spectator_timeline_v1_15 import archive_v2, open_spectator


def timeline_fixture():
    data = archive_v2([
        (0, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (0, 2, "HOME", "HOME", "HOME", "BLOCK", "POINT"),
        (1, 2, "AWAY", "HOME", "AWAY", "ATTACK", "POINT"),
        (1, 3, "HOME", "AWAY", "HOME", "RECEPTION", "POINT"),
        (2, 3, "AWAY", "AWAY", "AWAY", "SERVICE", "POINT"),
    ])
    data["players"][0]["name"] = "KATJA MIHAJLOVIC NOM COMPLET"
    return data


def test_shared_set_selector_defaults_to_live_and_controls_every_tab(browser):
    data = two_set_fixture()
    page, errors = open_spectator(browser, data)
    assert page.locator("#evolutionSet").input_value() == "2"
    assert page.locator("#liveSetStatus").inner_text() == "DIRECT · SET 2"
    assert page.locator("#returnToLive").is_hidden()
    assert page.locator(".tl-row.is-last .last-point").count() == 1

    page.locator("#evolutionSet").select_option("1")
    assert page.locator("#liveSetStatus").inner_text() == "REPLAY · SET 1"
    assert page.locator("#returnToLive").is_visible()
    assert page.locator("#timelineSet").inner_text().startswith("SET 1")
    assert page.locator("#headerHome").inner_text() == "2"
    assert page.locator("#headerAway").inner_text() == "1"

    for tab in ("live-score", "live-timeline", "live-graph", "ranking"):
        page.locator(f'[data-tab="{tab}"]').click()
        assert page.locator("#evolutionSet").input_value() == "1"
        assert page.evaluate("VolleySpectator.getModel().currentSet") == 1
    assert page.locator("#rankingSummary").inner_text().endswith("3 actions")

    page.locator("#returnToLive").click()
    assert page.locator("#evolutionSet").input_value() == "2"
    assert page.locator("#liveSetStatus").inner_text() == "DIRECT · SET 2"
    assert page.locator("#returnToLive").is_hidden()
    assert page.evaluate("VolleySpectator.getModel().currentSet") == 2
    assert not errors
    page.close()


def test_score_home_is_green_and_away_is_red(browser):
    page, errors = open_spectator(browser, timeline_fixture())
    page.locator('[data-tab="live-score"]').click()
    colours = page.evaluate(
        """() => ({
          homeTile:getComputedStyle(document.querySelector('.momentum-tile.home')).backgroundColor,
          awayTile:getComputedStyle(document.querySelector('.momentum-tile.away')).backgroundColor,
          homeBar:getComputedStyle(document.querySelector('#homeMomentumBar')).backgroundColor,
          awayBar:getComputedStyle(document.querySelector('#awayMomentumBar')).backgroundColor
        })"""
    )
    assert colours == {
        "homeTile": "rgb(24, 184, 90)",
        "awayTile": "rgb(217, 4, 41)",
        "homeBar": "rgb(24, 184, 90)",
        "awayBar": "rgb(217, 4, 41)",
    }
    assert not errors
    page.close()


def test_timeline_full_name_short_connectors_compact_rows_and_max_gap(browser):
    page, errors = open_spectator(browser, timeline_fixture(), {"width": 1536, "height": 1024})
    page.wait_for_timeout(250)
    name = page.locator(".event-name").last
    assert name.inner_text() == "KATJA MIHAJLOVIC NOM COMPLET"
    name_style = name.evaluate("e => ({whiteSpace:getComputedStyle(e).whiteSpace,overflow:getComputedStyle(e).overflow,textOverflow:getComputedStyle(e).textOverflow})")
    assert name_style == {"whiteSpace": "normal", "overflow": "visible", "textOverflow": "clip"}

    geometry = page.locator(".tl-row").evaluate_all(
        """rows => rows.map(row => {
          const hc=row.querySelector('.timeline-connector.home').getBoundingClientRect();
          const ac=row.querySelector('.timeline-connector.away').getBoundingClientRect();
          return {height:row.getBoundingClientRect().height,home:hc.width,away:ac.width};
        })"""
    )
    assert all(abs(row["home"] - row["away"]) < 1 for row in geometry)
    assert all(row["home"] <= 48.5 for row in geometry)
    assert max(row["height"] for row in geometry) <= 105
    max_gap = page.locator(".delta-bar.max-gap")
    assert max_gap.count() >= 1
    assert "écart maximum du set" in max_gap.first.get_attribute("aria-label")
    assert page.locator(".delta-bar.max-gap").first.evaluate("e => getComputedStyle(e).outlineStyle") == "dotted"
    assert not errors
    page.close()


def test_live_set_is_restored_on_reload_not_stale_replay(browser):
    page, errors = open_spectator(browser, two_set_fixture())
    page.locator("#evolutionSet").select_option("1")
    assert page.locator("#returnToLive").is_visible()
    page.reload()
    assert page.locator("#evolutionSet").input_value() == "2"
    assert page.locator("#liveSetStatus").inner_text() == "DIRECT · SET 2"
    assert page.locator(".tl-row.is-last").count() == 1
    assert not errors
    page.close()
