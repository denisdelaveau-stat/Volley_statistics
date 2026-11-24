"""v1.16.1 layout acceptance rules from `time line2.docx`."""
from __future__ import annotations

from test_spectator_timeline_v1_15 import archive_v2, open_spectator


def layout_fixture():
    data = archive_v2([
        (14, 8, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (14, 9, "HOME", "AWAY", "HOME", "BLOCK", "POINT"),
        (15, 9, "AWAY", "HOME", "AWAY", "SERVICE", "POINT"),
    ])
    data["players"][0]["name"] = "Tristan"
    data["players"][0]["number"] = 11
    data["players"][0]["role"] = "OPP"
    return data


def test_desktop_spine_is_home_left_mirrored_and_away_delta_hugs_score(browser):
    page, errors = open_spectator(browser, layout_fixture(), viewport={"width": 1536, "height": 1024})
    page.wait_for_timeout(250)
    geometry = page.locator(".timeline-board").evaluate(
        """board => {
          const row=board.querySelector('.tl-row');
          const node=row.querySelector('.score-node').getBoundingClientRect();
          const lane=row.querySelector('.delta-lane.away').getBoundingClientRect();
          const bar=row.querySelector('.delta-bar.away').getBoundingClientRect();
          const box=board.getBoundingClientRect();
          return {boardLeft:box.left, boardWidth:box.width,
                  spine:(node.left+node.right)/2,
                  laneLeft:lane.left, barLeft:bar.left,
                  scoreRight:node.right};
        }"""
    )
    relative_spine = (geometry["spine"] - geometry["boardLeft"]) / geometry["boardWidth"]
    assert 0.49 <= relative_spine <= 0.51
    assert abs(geometry["barLeft"] - geometry["scoreRight"]) < 1
    assert abs(geometry["barLeft"] - geometry["laneLeft"]) < 1
    assert not errors
    page.close()


def test_home_card_is_content_sized_with_balanced_side_padding(browser):
    page, errors = open_spectator(browser, layout_fixture(), viewport={"width": 1536, "height": 1024})
    geometry = page.locator(".event-card.home").evaluate(
        """card => {
          const c=card.getBoundingClientRect();
          const avatar=card.querySelector('.avatar').getBoundingClientRect();
          const copy=card.querySelector('.event-copy').getBoundingClientRect();
          const slot=card.closest('.event-slot').getBoundingClientRect();
              const connector=card.closest('.tl-row').querySelector('.timeline-connector.home').getBoundingClientRect();
          return {cardWidth:c.width, slotWidth:slot.width,
                  leftPad:avatar.left-c.left, rightPad:c.right-copy.right,
                      connectorGap:connector.left-c.right};
        }"""
    )
    assert abs(geometry["cardWidth"] - geometry["slotWidth"]) < 1
    assert abs(geometry["leftPad"] - geometry["rightPad"]) <= 1
    assert 14 <= geometry["leftPad"] <= 16
    assert abs(geometry["connectorGap"]) < 1
    assert not errors
    page.close()


def test_android_portrait_keeps_page_stable_and_timeline_scrollable(browser):
    page, errors = open_spectator(browser, layout_fixture(), viewport={"width": 412, "height": 915})
    page.wait_for_timeout(250)
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    board = page.locator(".timeline-board")
    dimensions = board.evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
    assert dimensions["scroll"] > dimensions["client"]
    assert page.locator(".event-card.home").first.bounding_box()["x"] <= 60
    board.evaluate("e => e.scrollLeft = e.scrollWidth")
    assert page.locator(".away-marker").first.bounding_box()["x"] < 412
    for selector in ("[data-order=oldestFirst]", "[data-order=newestFirst]", "#windowSize"):
        assert page.locator(selector).bounding_box()["height"] >= 44
    assert not errors
    page.close()
