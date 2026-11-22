"""v1.16.2 AWAY marker, maximum delta, connector and responsive geometry."""
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


def alignment_fixture():
    # Every rally is an AWAY terminal event. The first row owns the common-scale
    # maximum (+6); the other rows prove that marker placement is data invariant.
    return archive_v2([
        (6, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (7, 2, "AWAY", "HOME", "AWAY", "SERVICE", "POINT"),
        (8, 3, "AWAY", "AWAY", "AWAY", "BLOCK", "POINT"),
        (9, 5, "AWAY", "HOME", "AWAY", "ATTACK", "POINT"),
    ])


def row_geometry(page):
    return page.locator(".tl-row:has(.away-marker)").evaluate_all(
        """rows => rows.map(row => {
          const rect = selector => row.querySelector(selector).getBoundingClientRect();
          const marker = rect('.away-marker');
          const lane = rect('.delta-lane.away');
          const barElement = row.querySelector('.delta-bar.away');
          const bar = barElement ? barElement.getBoundingClientRect() : null;
          const slotElement = row.querySelector('.away-slot');
          const slot = slotElement.getBoundingClientRect();
          const score = rect('.score-pill');
          const pseudo = getComputedStyle(slotElement, '::after');
          const connectorLeft = slot.left + parseFloat(pseudo.left);
          const connectorRight = slot.right - parseFloat(pseudo.right);
          let text = null;
          if (barElement) {
            const range = document.createRange();
            range.selectNodeContents(barElement);
            text = range.getBoundingClientRect().toJSON();
          }
          return {marker:marker.toJSON(), lane:lane.toJSON(),
                  bar:bar && bar.toJSON(), text,
                  connectorLeft, connectorRight, score:score.toJSON()};
        })"""
    )


def test_delta_and_away_marker_form_one_compact_horizontal_sequence(browser):
    page, errors = open_spectator(browser, alignment_fixture(), VIEWPORTS["1536x1024"])
    page.wait_for_timeout(250)
    rows = row_geometry(page)
    assert len(rows) == 4

    marker_lefts = [row["marker"]["left"] for row in rows]
    assert max(marker_lefts) - min(marker_lefts) < 1

    maximum = max((row for row in rows if row["bar"]), key=lambda row: row["bar"]["width"])
    assert abs(maximum["bar"]["left"] - maximum["lane"]["left"]) < 1

    for row in rows:
        assert row["bar"]["right"] < row["marker"]["left"]
        assert abs((row["marker"]["left"] - row["bar"]["right"]) - 12) < 1
        assert abs((row["bar"]["top"] + row["bar"]["height"] / 2) -
                   (row["marker"]["top"] + row["marker"]["height"] / 2)) < 1
        # The +N badge stays inside the red bar and clear of the circle.
        assert row["text"]["right"] <= row["bar"]["right"] - 6
    assert not errors
    page.close()


def test_spine_moves_left_and_connector_reaches_score_without_overlap(browser):
    page, errors = open_spectator(browser, alignment_fixture(), VIEWPORTS["1536x1024"])
    page.wait_for_timeout(250)
    rows = row_geometry(page)
    for row in rows:
        assert abs((row["connectorLeft"] - row["marker"]["right"]) - 8) < 1
        assert abs(row["connectorRight"] - row["score"]["left"]) < 1

    board = page.locator(".timeline-board").bounding_box()
    score = page.locator(".score-node").first.bounding_box()
    relative_spine = (score["x"] + score["width"] / 2 - board["x"]) / board["width"]
    assert 0.44 <= relative_spine <= 0.48
    assert relative_spine <= 0.61 - 0.13  # v1.16.1 lower bound minus a material shift
    assert board["x"] <= score["x"] and score["x"] + score["width"] <= board["x"] + board["width"]
    assert not errors
    page.close()


def test_alignment_and_safety_hold_on_desktop_tablet_and_mobile(browser):
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, alignment_fixture(), viewport)
        page.wait_for_timeout(250)
        rows = row_geometry(page)
        maximum = max((row for row in rows if row["bar"]), key=lambda row: row["bar"]["width"])
        assert max(row["marker"]["left"] for row in rows) - min(row["marker"]["left"] for row in rows) < 1, name
        expected_delta_marker_gap = 12 if viewport["width"] > 1100 else 8
        for row in rows:
            assert abs((row["marker"]["left"] - row["bar"]["right"]) - expected_delta_marker_gap) < 1, name
            assert abs((row["bar"]["top"] + row["bar"]["height"] / 2) -
                       (row["marker"]["top"] + row["marker"]["height"] / 2)) < 1, name
            assert row["text"]["right"] <= row["bar"]["right"] - 6, name
            assert abs((row["connectorLeft"] - row["marker"]["right"]) - 8) < 1, name
            assert abs(row["connectorRight"] - row["score"]["left"]) < 1, name
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), name
        if viewport["width"] <= 780:
            board = page.locator(".timeline-board")
            sizes = board.evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth, left:e.getBoundingClientRect().left})")
            assert sizes["scroll"] > sizes["client"]
            assert maximum["lane"]["left"] - sizes["left"] >= 11
            # The score remains reachable and fully visible in the board scroller.
            for selector in (".score-pill",):
                board.evaluate("(e, sel) => { const x=e.querySelector(sel), r=x.getBoundingClientRect(), b=e.getBoundingClientRect(); e.scrollLeft += r.left-b.left-(e.clientWidth-r.width)/2; }", selector)
                box = page.locator(selector).first.bounding_box()
                board_box = board.bounding_box()
                assert box["x"] >= board_box["x"] and box["x"] + box["width"] <= board_box["x"] + board_box["width"], (name, selector)
        assert not errors, name
        page.close()


def test_home_internal_layout_is_identical_to_v1_16_1_and_only_translates_in_x(browser):
    baseline = json.loads((ROOT / "tests/baselines/home_layout_v1_16_1.json").read_text())
    fixture = json.loads(V2_FIXTURE.read_text())
    measure = r"""() => {
      const card=document.querySelector('.event-card.home');
      const score=document.querySelector('.score-node');
      const cr=card.getBoundingClientRect();
      const rect=sel=>{const e=card.querySelector(sel),r=e.getBoundingClientRect(),s=getComputedStyle(e);return {
        x:r.x-cr.x,y:r.y-cr.y,width:r.width,height:r.height,color:s.color,
        backgroundColor:s.backgroundColor,borderColor:s.borderColor,fontSize:s.fontSize,
        padding:s.padding,gap:s.gap,display:s.display,text:e.textContent.trim()}};
      const sr=score.getBoundingClientRect(),cs=getComputedStyle(card);
      return {scoreCenter:sr.x+sr.width/2,
        card:{x:cr.x,y:cr.y,width:cr.width,height:cr.height,padding:cs.padding,gap:cs.gap,
              display:cs.display,backgroundImage:cs.backgroundImage,borderColor:cs.borderColor},
        order:Array.from(card.children).map(e=>e.className),
        elements:{avatar:rect('.avatar'),number:rect('.avatar strong'),role:rect('.avatar small'),
                  copy:rect('.event-copy'),name:rect('.event-name'),action:rect('.home-action')}};
    }"""
    numeric = ("x", "y", "width", "height")
    styles = ("color", "backgroundColor", "borderColor", "fontSize", "padding", "gap", "display", "text")

    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, fixture, viewport)
        page.wait_for_timeout(500)
        current = page.evaluate(measure)
        before = baseline[name]
        score_shift = current["scoreCenter"] - before["scoreCenter"]
        card_shift = current["card"]["x"] - before["card"]["x"]
        assert score_shift < -100, name
        assert abs(card_shift - score_shift) < 1, name
        assert abs(current["card"]["y"] - before["card"]["y"]) < 1, name
        for key in ("width", "height"):
            assert abs(current["card"][key] - before["card"][key]) < 1, (name, key)
        for key in ("padding", "gap", "display", "backgroundImage", "borderColor"):
            assert current["card"][key] == before["card"][key], (name, key)
        assert current["order"] == before["order"], name
        for element, expected in before["elements"].items():
            observed = current["elements"][element]
            for key in numeric:
                assert abs(observed[key] - expected[key]) < 1, (name, element, key)
            for key in styles:
                assert observed[key] == expected[key], (name, element, key)
        board = page.locator(".timeline-board")
        if viewport["width"] > 780:
            board_box = board.bounding_box()
            for selector in (".score-pill", ".event-card.home"):
                box = page.locator(selector).first.bounding_box()
                assert box["x"] >= board_box["x"] and box["x"] + box["width"] <= board_box["x"] + board_box["width"], (name, selector)
        else:
            for selector in (".score-pill", ".event-card.home"):
                board.evaluate("(e, sel) => { const x=e.querySelector(sel), r=x.getBoundingClientRect(), b=e.getBoundingClientRect(); e.scrollLeft += r.left-b.left-(e.clientWidth-r.width)/2; }", selector)
                box = page.locator(selector).first.bounding_box()
                board_box = board.bounding_box()
                assert box["x"] >= board_box["x"] and box["x"] + box["width"] <= board_box["x"] + board_box["width"], (name, selector)
        assert not errors, name
        page.close()


def test_visual_baselines_desktop_tablet_and_mobile(browser, tmp_path):
    for name, viewport in VIEWPORTS.items():
        page, errors = open_spectator(browser, alignment_fixture(), viewport)
        page.wait_for_timeout(500)
        actual = tmp_path / f"timeline_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / f"tests/visual_baselines/away_alignment_{name}_v1_16_2.png"
        assert baseline.exists(), f"Missing v1.16.2 visual baseline for {name}"
        observed = Image.open(actual).convert("RGB")
        expected = Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        diff = ImageChops.difference(expected, observed)
        # Keep the same strict layout/color intent as the desktop baseline while
        # allowing cross-run Chromium font and border anti-aliasing at three sizes.
        assert max(ImageStat.Stat(diff).mean) < 3.5, name
        assert not errors, name
        page.close()
