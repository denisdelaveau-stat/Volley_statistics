"""Acceptance coverage for Modification UI 7 in Volley Live Capture v1.6.9."""

from helpers import open_match


def _style(locator, properties, pseudo=None):
    return locator.evaluate(
        "(e, x) => Object.fromEntries(x.ps.map(p => [p, getComputedStyle(e, x.pseudo)[p]]))",
        {"ps": properties, "pseudo": pseudo},
    )


def test_score_cluster_is_compact_equally_spaced_and_keeps_service_line(browser):
    page, errors = open_match(browser, "intermediate", focus_off=(4,))
    blocks = page.locator("#liveScore > *")
    assert blocks.count() == 5
    boxes = [blocks.nth(i).bounding_box() for i in range(blocks.count())]
    gaps = [boxes[i + 1]["x"] - (boxes[i]["x"] + boxes[i]["width"]) for i in range(4)]
    assert all(abs(gap - 5) < 0.1 for gap in gaps)
    assert boxes[-1]["x"] + boxes[-1]["width"] - boxes[0]["x"] <= 210.1

    active_line = page.locator(".score-side.serving .service-line")
    score_box = page.locator(".score-side.serving .digit-box").bounding_box()
    line_box = active_line.bounding_box()
    assert _style(active_line, ["visibility"])["visibility"] == "visible"
    assert line_box["y"] >= score_box["y"] + score_box["height"]
    assert page.locator(".score-side:not(.serving) .service-line").evaluate(
        "e => getComputedStyle(e).visibility"
    ) == "hidden"
    assert not errors
    page.close()


def test_net_posts_are_contained_to_net_height(browser):
    for level in ("basic", "intermediate", "advanced"):
        page, errors = open_match(browser, level, focus_off=(4,))
        net = page.locator(".vlc-net")
        assert net.bounding_box()["height"] == 28
        for pseudo in ("::before", "::after"):
            style = _style(net, ["top", "height"], pseudo)
            assert style == {"top": "-5px", "height": "28px"}
        assert _style(net, ["backgroundColor"])["backgroundColor"] == "rgba(0, 0, 0, 0)"
        assert not errors
        page.close()


def test_bench_to_team_input_divider_is_dashed_and_mode_scoped(browser):
    for level in ("intermediate", "advanced"):
        page, errors = open_match(browser, level, focus_off=(4,))
        team = page.locator(".vlc-result-bar.team")
        style = _style(team, ["borderTopStyle", "borderTopWidth", "paddingTop", "marginTop"])
        assert style == {
            "borderTopStyle": "dashed",
            "borderTopWidth": "2px",
            "paddingTop": "8px",
            "marginTop": "8px",
        }
        assert team.bounding_box()["y"] > page.locator(".bench-row").bounding_box()["y"]
        assert not errors
        page.close()

    page, errors = open_match(browser, "basic")
    assert _style(page.locator(".vlc-result-bar.team"), ["borderTopStyle"])["borderTopStyle"] == "none"
    assert not errors
    page.close()
