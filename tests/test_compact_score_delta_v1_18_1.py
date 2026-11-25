"""Compact score-adjacent timeline delta acceptance tests for v1.18.1."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageStat

from test_spectator_timeline_v1_15 import archive_v2, open_spectator

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = {
    "1536x1024": {"width": 1536, "height": 1024},
    "1024x768": {"width": 1024, "height": 768},
    "844x390": {"width": 844, "height": 390},
    "390x844": {"width": 390, "height": 844},
}


def compact_fixture():
    data = archive_v2([
        (1, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (2, 0, "AWAY", "AWAY", "AWAY", "BLOCK", "POINT"),
        (2, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (2, 2, "HOME", "HOME", "HOME", "BLOCK", "POINT"),
        (2, 3, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
    ])
    data["players"][0].update({"name": "Tristan", "number": 11, "role": "OPP"})
    return data


def rows_geometry(page):
    return page.locator(".tl-row").evaluate_all(
        """rows => rows.map(row => {
          const rect = selector => {
            const element = row.querySelector(selector);
            return element ? element.getBoundingClientRect().toJSON() : null;
          };
          return {
            marker: rect('.away-marker'),
            awayConnector: rect('.timeline-connector.away'),
            awayLane: rect('.delta-lane.away'),
            awayBar: rect('.delta-bar.away'),
            awayBadge: rect('.delta-bar.away .delta-badge'),
            score: rect('.score-pill'),
            homeLane: rect('.delta-lane.home'),
            homeBar: rect('.delta-bar.home'),
            homeBadge: rect('.delta-bar.home .delta-badge'),
            homeConnector: rect('.timeline-connector.home'),
            card: rect('.event-card.home')
          };
        })"""
    )


def centre_y(rect):
    return rect["top"] + rect["height"] / 2


def contrast_ratio(page, selector):
    return page.locator(selector).first.evaluate(
        r"""e => {
          const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
          const lum=s=>{const c=rgb(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
          const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);
          return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }"""
    )


def test_delta_bars_hug_score_and_share_vertical_centre(browser):
    page, errors = open_spectator(browser, compact_fixture(), VIEWPORTS["1536x1024"])
    page.wait_for_timeout(250)
    away_seen = home_seen = False
    for row in rows_geometry(page):
        score_centre = centre_y(row["score"])
        if row["awayBar"]:
            away_seen = True
            assert abs(row["awayBar"]["left"] - row["score"]["right"]) < 1
            assert abs(row["awayBar"]["left"] - row["awayLane"]["left"]) < 1
            assert abs(centre_y(row["awayBar"]) - score_centre) < 1
            assert abs(centre_y(row["awayBadge"]) - score_centre) < 1
        if row["homeBar"]:
            home_seen = True
            assert abs(row["score"]["left"] - row["homeBar"]["right"]) < 1
            assert abs(row["homeBar"]["right"] - row["homeLane"]["right"]) < 1
            assert abs(centre_y(row["homeBar"]) - score_centre) < 1
            assert abs(centre_y(row["homeBadge"]) - score_centre) < 1
    assert away_seen and home_seen
    assert not errors
    page.close()


def test_connectors_shrink_without_overlap_and_cards_keep_internal_geometry(browser):
    widths = {}
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, compact_fixture(), viewport)
        page.wait_for_timeout(250)
        rows = rows_geometry(page)
        widths[name] = rows[0]["awayConnector"]["width"]
        for row in rows:
            assert abs(row["awayConnector"]["width"] - row["homeConnector"]["width"]) < 1
            if row["homeLane"]["width"]:
                assert row["homeConnector"]["right"] <= row["homeLane"]["left"]
                assert row["homeLane"]["right"] <= row["score"]["left"]
            else:
                assert abs(row["homeConnector"]["right"] - row["score"]["left"]) < 1
            if row["awayLane"]["width"]:
                assert row["score"]["right"] <= row["awayLane"]["left"]
                assert row["awayLane"]["right"] <= row["awayConnector"]["left"]
            else:
                assert abs(row["awayConnector"]["left"] - row["score"]["right"]) < 1
            if row["marker"]:
                assert row["awayConnector"]["right"] <= row["marker"]["left"]
            if row["card"]:
                assert row["card"]["right"] <= row["homeConnector"]["left"]
        if viewport["width"] == 1536:
            card = page.locator(".event-card.home").first
            card_box = card.bounding_box()
            avatar = card.locator(".avatar").bounding_box()
            copy = card.locator(".event-copy").bounding_box()
            assert abs((avatar["x"] - card_box["x"]) - 14) <= 1
            assert abs((card_box["x"] + card_box["width"] - (copy["x"] + copy["width"])) - 14) <= 1
            assert abs((copy["x"] - (avatar["x"] + avatar["width"])) - 12) <= 1
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert not errors
        page.close()
    assert all(abs(width - 40) < 1 for width in widths.values())


def test_badges_are_readable_accessible_and_mobile_content_can_be_reached(browser):
    page, errors = open_spectator(browser, compact_fixture(), VIEWPORTS["390x844"])
    page.wait_for_timeout(250)
    badges = page.locator(".delta-badge")
    assert badges.count() == 4
    assert all(text.startswith("+") for text in badges.all_inner_texts())
    for badge in badges.all():
        box = badge.bounding_box()
        assert box["width"] >= 38 and box["height"] >= 28
    assert contrast_ratio(page, ".delta-bar.away .delta-badge") >= 4.5
    assert contrast_ratio(page, ".delta-bar.home .delta-badge") >= 4.5
    assert page.locator(".delta-bar.away").first.get_attribute("aria-label")
    assert page.locator(".delta-bar.home").first.get_attribute("aria-label")

    board = page.locator(".timeline-board")
    dimensions = board.evaluate("e => ({client:e.clientWidth,scroll:e.scrollWidth})")
    assert dimensions["scroll"] > dimensions["client"]
    board.evaluate("e => e.scrollLeft = 0")
    assert page.locator(".event-card.home").first.is_visible()
    board.evaluate("e => e.scrollLeft = e.scrollWidth")
    assert page.locator(".away-marker").first.is_visible()
    assert not errors
    page.close()


def test_home_left_header_timeline_graph_and_score_semantics_are_preserved(browser):
    page, errors = open_spectator(browser, compact_fixture(), VIEWPORTS["1024x768"])
    title_home = page.locator("#homeName").bounding_box()
    title_away = page.locator("#awayName").bounding_box()
    assert title_home["x"] < title_away["x"]
    assert "Score : HOME — AWAY" in page.locator(".timeline-title").inner_text()
    assert page.locator('[data-panel="live-timeline"] #liveScoreboard, [data-panel="live-timeline"] #momentumCard').count() == 0

    halves = page.locator(".score-pill").first.locator(".score-half")
    assert halves.nth(0).get_attribute("class").split()[1] == "home"
    assert halves.nth(1).get_attribute("class").split()[1] == "away"
    assert halves.nth(0).inner_text() == "0"
    assert halves.nth(1).inner_text() == "1"

    assert page.locator('[data-order="oldestFirst"]').is_visible()
    assert page.locator("#windowSize").is_visible()
    assert page.locator(".replay-status").is_visible()
    assert page.locator(".rally-caption").count() == 5
    assert page.locator(".score-half.score-accent").count() == 5
    assert page.locator(".score-pill.latest .score-half.score-accent").count() == 1
    assert page.locator(".last-point").count() == 1

    page.locator('[data-tab="live-score"]').click()
    header_home = page.locator("#headerHome").bounding_box()
    header_away = page.locator("#headerAway").bounding_box()
    assert header_home["x"] < header_away["x"]
    assert page.locator("#headerHome").inner_text() == "3"
    assert page.locator("#headerAway").inner_text() == "2"
    assert page.locator(".team-crest").count() == 2
    assert page.locator("#liveScoreboard").count() == 1
    assert page.locator("#momentumCard").count() == 1
    assert page.locator(".summary-card").count() == 0
    assert page.locator("#momentumCard").bounding_box()["y"] > page.locator("#liveScoreboard").bounding_box()["y"]

    page.locator('[data-tab="live-graph"]').click()
    score_rows = page.locator("#scoreRows .value-row")
    fault_rows = page.locator("#faultRows .value-row")
    assert score_rows.nth(0).locator(".row-label").inner_text() == "HOME"
    assert score_rows.nth(1).locator(".row-label").inner_text() == "AWAY"
    assert fault_rows.nth(0).locator(".row-label").inner_text() == "HOME"
    assert fault_rows.nth(1).locator(".row-label").inner_text() == "AWAY"
    assert page.locator(".score-delta-chart .delta-point").count() == 5
    assert page.locator(".fault-delta-chart .delta-point").count() == 5
    assert page.locator(".score-delta-chart").get_attribute("aria-label").startswith("Évolution du score")
    assert page.locator(".fault-delta-chart").get_attribute("aria-label").startswith("Évolution des fautes")
    assert page.locator(".score-delta-chart .delta-point").evaluate_all("els => els.map(e => +e.dataset.value)") == [-1, -2, -1, 0, 1]
    assert not errors
    page.close()


def test_offline_cache_and_four_visual_baselines(browser, tmp_path):
    sw = (ROOT / "sw.js").read_text(encoding="utf-8")
    assert "volley-live-capture-v1.28.0" in sw
    for asset in ("spectator.html", "spectator.css", "spectator.js"):
        assert asset in sw

    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, compact_fixture(), viewport)
        page.wait_for_timeout(350)
        actual = tmp_path / f"compact_timeline_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / "tests" / "visual_baselines" / f"compact_timeline_{name}_v1_26_1.png"
        assert baseline.exists(), f"Missing visual baseline {baseline.name}"
        observed = Image.open(actual).convert("RGB")
        expected = Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        diff = ImageChops.difference(expected, observed)
        assert max(ImageStat.Stat(diff).mean) < 3.5, (name, ImageStat.Stat(diff).mean)
        assert not errors
        page.close()
