"""Legacy v1.16.2 compact AWAY geometry preserved by v1.17.0."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops, ImageStat

from test_spectator_timeline_v1_15 import archive_v2, open_spectator

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = {
    "1536x1024": {"width": 1536, "height": 1024},
    "1024x768": {"width": 1024, "height": 768},
    "412x915": {"width": 412, "height": 915},
}


def alignment_fixture():
    data = archive_v2([
        (6, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (7, 2, "AWAY", "HOME", "AWAY", "SERVICE", "POINT"),
        (7, 8, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (9, 8, "AWAY", "HOME", "AWAY", "BLOCK", "POINT"),
    ])
    data["players"][0].update({"name": "Tristan", "number": 11, "role": "OPP"})
    return data


def geometry(page):
    return page.locator(".tl-row").evaluate_all(
        """rows => rows.map(row => {
          const box = sel => row.querySelector(sel).getBoundingClientRect().toJSON();
          const bar = row.querySelector('.delta-bar');
          return {awaySlot:box('.away-slot'), homeSlot:box('.home-slot'), score:box('.score-pill'),
                  awayConnector:box('.timeline-connector.away'), homeConnector:box('.timeline-connector.home'),
                  marker:row.querySelector('.away-marker') ? box('.away-marker') : null,
                  card:row.querySelector('.event-card.home') ? box('.event-card.home') : null,
                  awayLane:box('.delta-lane.away'), homeLane:box('.delta-lane.home'),
                  bar:bar ? bar.getBoundingClientRect().toJSON() : null,
                  barSide:bar ? (bar.classList.contains('away') ? 'away' : 'home') : null};
        })"""
    )


def test_compact_delta_marker_sequence_and_equal_connectors(browser):
    page, errors = open_spectator(browser, alignment_fixture(), VIEWPORTS["1536x1024"])
    page.wait_for_timeout(250)
    rows = geometry(page)
    marker_rights = [row["marker"]["right"] for row in rows if row["marker"]]
    assert max(marker_rights) - min(marker_rights) < 1
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
    assert not errors
    page.close()


def test_spine_stays_in_v1_16_2_left_shift_band(browser):
    page, errors = open_spectator(browser, alignment_fixture(), VIEWPORTS["1536x1024"])
    board = page.locator(".timeline-board").bounding_box()
    score = page.locator(".score-node").first.bounding_box()
    relative = (score["x"] + score["width"] / 2 - board["x"]) / board["width"]
    assert 0.52 <= relative <= 0.56
    assert not errors
    page.close()


def test_alignment_and_internal_scrolling_hold_at_three_viewports(browser):
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, alignment_fixture(), viewport)
        page.wait_for_timeout(250)
        expected_gap = 6
        for row in geometry(page):
            assert abs(row["awayConnector"]["width"] - row["homeConnector"]["width"]) < 1, name
            if row["marker"]:
                assert abs((row["marker"]["left"] - row["awayConnector"]["right"]) - expected_gap) < 1, name
            if row["card"]:
                assert abs((row["homeConnector"]["left"] - row["card"]["right"]) - expected_gap) < 1, name
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), name
        if viewport["width"] <= 780:
            sizes = page.locator(".timeline-board").evaluate("e => ({client:e.clientWidth,scroll:e.scrollWidth})")
            assert sizes["scroll"] > sizes["client"], name
        assert not errors, name
        page.close()


def test_visual_baselines_desktop_tablet_and_mobile(browser, tmp_path):
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, alignment_fixture(), viewport)
        page.wait_for_timeout(350)
        actual = tmp_path / f"timeline_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / f"tests/visual_baselines/away_alignment_{name}_v1_19_1.png"
        assert baseline.exists(), f"Missing v1.19.1 visual baseline for {name}"
        observed = Image.open(actual).convert("RGB")
        expected = Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        diff = ImageChops.difference(expected, observed)
        # Keep the threshold strict enough to catch geometry/color drift while
        # tolerating small cross-run Chromium font and border antialiasing changes.
        assert max(ImageStat.Stat(diff).mean) < 5.0, name
        assert not errors, name
        page.close()
