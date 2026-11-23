"""Acceptance tests for update 10 / Volley Live Capture v1.17.0."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

from test_spectator_timeline_v1_15 import V2_FIXTURE, archive_v2, open_spectator

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = {
    "1536x1024": {"width": 1536, "height": 1024},
    "1024x768": {"width": 1024, "height": 768},
    "412x915": {"width": 412, "height": 915},
}


def update10_fixture(*, basic=False):
    data = archive_v2([
        (1, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (1, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (1, 2, "HOME", "HOME", "HOME", "BLOCK", "POINT"),
        (2, 2, "AWAY", "HOME", "AWAY", "SERVICE", "POINT"),
        (2, 3, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (3, 3, "AWAY", "AWAY", "AWAY", "BLOCK", "POINT"),
        (3, 4, "HOME", "HOME", "HOME", "ATTACK", "POINT"),
    ], basic=basic)
    data["teams"][0]["name"] = "As Cannes"
    data["teams"][1]["name"] = "Frejus"
    data["players"][0].update({"name": "Tristan", "number": 11, "role": "OPP"})
    return data


def contrast_ratio(page, selector):
    return page.locator(selector).first.evaluate(
        r"""e => {
          const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
          const lum=s=>{const c=rgb(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
          const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);
          return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }"""
    )


def test_update10_header_score_connectors_home_delta_and_filters(browser):
    page, errors = open_spectator(browser, update10_fixture(), VIEWPORTS["1536x1024"])
    page.wait_for_timeout(300)

    # Modification 3: real team names never replace the generic labels.
    assert page.locator("#awayName").inner_text() == "AWAY"
    assert page.locator("#homeName").inner_text() == "HOME"
    assert "Frejus" not in page.locator(".timeline-title").inner_text()
    assert "As Cannes" not in page.locator(".timeline-title").inner_text()
    header_boxes = [page.locator("#awayName").bounding_box(), page.locator("#homeName").bounding_box()]
    assert abs(header_boxes[0]["width"] - header_boxes[1]["width"]) < 1
    assert abs(header_boxes[0]["height"] - header_boxes[1]["height"]) < 1

    # Modifications 1 and 4: equal connector tracks and compact delta/card gaps.
    rows = page.locator(".tl-row").evaluate_all(
        """rows => rows.map(r => {
          const rect=s=>r.querySelector(s).getBoundingClientRect().toJSON();
          const marker=r.querySelector('.away-marker'), card=r.querySelector('.event-card.home');
          const homeBar=r.querySelector('.delta-bar.home');
          return {awayConnector:rect('.timeline-connector.away'),homeConnector:rect('.timeline-connector.home'),
                  awayLane:rect('.delta-lane.away'),homeLane:rect('.delta-lane.home'),score:rect('.score-pill'),
                  marker:marker&&marker.getBoundingClientRect().toJSON(),card:card&&card.getBoundingClientRect().toJSON(),
                  homeBar:homeBar&&homeBar.getBoundingClientRect().toJSON()};
        })"""
    )
    for row in rows:
        assert abs(row["awayConnector"]["width"] - row["homeConnector"]["width"]) < 1
        if row["marker"]:
            assert 5 <= row["awayLane"]["left"] - row["score"]["right"] <= 7
            assert 5 <= row["awayConnector"]["left"] - row["awayLane"]["right"] <= 7
            assert 5 <= row["marker"]["left"] - row["awayConnector"]["right"] <= 7
        if row["card"]:
            assert 5 <= row["homeConnector"]["left"] - row["card"]["right"] <= 7
            assert 5 <= row["homeLane"]["left"] - row["homeConnector"]["right"] <= 7
            assert 5 <= row["score"]["left"] - row["homeLane"]["right"] <= 7
            if row["homeBar"]:
                assert abs(row["homeBar"]["right"] - row["homeLane"]["right"]) < 1
                assert abs((row["homeBar"]["top"] + row["homeBar"]["height"] / 2) -
                           (row["card"]["top"] + row["card"]["height"] / 2)) < 1

    # Modifications 2 and 5: attached rally cell, elongated score and equal controls.
    score = page.locator(".score-pill").first.bounding_box()
    rally = page.locator(".rally-caption").first.bounding_box()
    assert score["width"] >= 148
    assert rally["width"] < score["width"]
    assert abs(rally["y"] + rally["height"] - score["y"] - 2) <= 2
    controls = [page.locator('[data-order="oldestFirst"]').bounding_box(),
                page.locator('[data-order="newestFirst"]').bounding_box(),
                page.locator("#windowSize").bounding_box()]
    assert max(c["height"] for c in controls) - min(c["height"] for c in controls) < 1
    assert max(c["width"] for c in controls) - min(c["width"] for c in controls) < 1
    assert contrast_ratio(page, ".segment button.active") >= 4.5
    assert not errors
    page.close()


def test_vivid_score_accents_keep_exactly_one_black_half(browser):
    page, errors = open_spectator(browser, update10_fixture(), VIEWPORTS["1536x1024"])
    observed = page.locator(".tl-row").evaluate_all(
        """rows => rows.map(r => ({accent:r.dataset.scoreAccent,
          colours:[getComputedStyle(r.querySelector('.score-half.away')).backgroundColor,
                   getComputedStyle(r.querySelector('.score-half.home')).backgroundColor]}))"""
    )
    accents = {"so": "rgb(255, 212, 59)", "bp-home": "rgb(24, 184, 90)", "bp-away": "rgb(217, 4, 41)"}
    for row in observed:
        assert row["colours"].count("rgb(5, 7, 11)") == 1
        assert accents[row["accent"]] in row["colours"]
    assert contrast_ratio(page, ".score-half.score-accent.so") >= 4.5
    assert contrast_ratio(page, ".score-half.score-accent.bp-home") >= 4.5
    assert contrast_ratio(page, ".score-half.score-accent.bp-away") >= 4.5
    assert not errors
    page.close()


def test_live_graph_replaces_stats_and_is_json_driven(browser):
    """The v1.17 tab/JSON contract remains; v1.18 supersedes its two-line chart."""
    data = update10_fixture()
    page, errors = open_spectator(browser, data, VIEWPORTS["1536x1024"])
    assert page.locator('[data-tab="stats"]').count() == 0
    assert page.locator('[data-tab="live-graph"]').inner_text() == "GRAPH"
    page.locator('[data-tab="live-graph"]').click()
    assert page.locator('[data-panel="live-graph"]').is_visible()
    assert page.locator(".score-row.home .evolution-cell").count() == 5
    assert page.locator(".score-row.away .evolution-cell").count() == 5
    assert page.locator(".score-delta-chart .delta-point").count() == 5
    assert page.locator(".fault-delta-chart .delta-point").count() == 5
    observed = page.locator(".score-delta-chart .delta-point").evaluate_all("els => els.map(e => +e.dataset.value)")
    expected = [r["score"]["home"] - r["score"]["away"] for r in page.evaluate("VolleySpectator.visibleRows().rows")]
    assert observed == expected
    assert page.locator(".score-delta-chart").get_attribute("aria-label")
    assert page.locator(".fault-delta-chart").get_attribute("aria-label")

    page.locator("#graphWindowSize").select_option("all")
    assert page.locator("#windowSize").input_value() == "all"
    assert page.locator(".score-delta-chart .delta-point").count() == len(data["rallies"])
    page.locator('[data-graph-order="newestFirst"]').click()
    assert page.locator('[data-order="newestFirst"]').get_attribute("aria-pressed") == "true"
    assert page.evaluate("VolleySpectator.visibleRows().rows[0].rally") == len(data["rallies"])
    assert not errors
    page.close()

def test_live_graph_has_empty_state_and_basic_does_not_invent_actions(browser):
    empty = archive_v2([], basic=True)
    page, errors = open_spectator(browser, empty, VIEWPORTS["1024x768"])
    page.locator('[data-tab="live-graph"]').click()
    assert page.locator("#graphEmpty").is_visible()
    assert page.locator("#graphContent").is_hidden()
    assert page.locator(".delta-point").count() == 0
    page.close()

    page, basic_errors = open_spectator(browser, update10_fixture(basic=True), VIEWPORTS["1024x768"])
    assert page.locator(".event-card,.away-marker,.home-action").count() == 0
    page.locator('[data-tab="live-graph"]').click()
    assert page.locator(".score-delta-chart .delta-point").count() == 5
    assert page.locator(".fault-delta-chart .delta-point").count() == 5
    assert not errors and not basic_errors
    page.close()

def test_responsive_internal_scrolling_accessibility_and_offline_cache(browser):
    long_data = archive_v2([(i, 0, "AWAY", "AWAY") for i in range(1, 13)])
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, long_data, viewport)
        page.locator("#windowSize").select_option("all")
        page.locator('[data-tab="live-graph"]').click()
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), name
        scroll = page.locator(".evolution-scroll").evaluate("e => ({client:e.clientWidth,scroll:e.scrollWidth,tab:e.tabIndex})")
        if viewport["width"] <= 780:
            assert scroll["scroll"] > scroll["client"], name
        assert scroll["tab"] == 0
        assert page.locator(".score-legend").get_attribute("aria-label") == "Légende des cellules de score"
        assert not errors, name
        page.close()

    sw = (ROOT / "sw.js").read_text(encoding="utf-8")
    assert "volley-live-capture-v1.22.0" in sw
    for asset in ("spectator.html", "spectator.css", "spectator.js"):
        assert asset in sw

def test_update10_visual_baselines_at_three_viewports(browser, tmp_path):
    data = json.loads(V2_FIXTURE.read_text())
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, data, viewport)
        page.wait_for_timeout(350)
        actual = tmp_path / f"timeline_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / f"tests/visual_baselines/timeline_{name}_v1_20_0.png"
        assert baseline.exists(), f"Missing {baseline.name}"
        observed = Image.open(actual).convert("RGB")
        expected = Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        diff = ImageChops.difference(expected, observed)
        assert max(ImageStat.Stat(diff).mean) < 3.5, (name, "timeline")
        assert not errors, name
        page.close()

