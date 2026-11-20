"""Responsive containment checks for v1.11 quick capture."""
from helpers import open_match


def test_quick_pad_and_player_tray_fit_mobile_width_in_all_levels(browser):
    for level in ("basic","intermediate","advanced"):
        page, errors=open_match(browser,level,focus_off=())
        viewport=page.viewport_size["width"]
        for selector in ("#capturePanel",".quick-entry",".quick-player-tray"):
            box=page.locator(selector).bounding_box(); assert box["x"]>=0 and box["x"]+box["width"]<=viewport+1
        assert not errors; page.close()


def test_player_tray_has_dashed_bench_divider_and_no_legacy_net(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    style=page.locator(".bench-row").evaluate("e=>({top:getComputedStyle(e).borderTopStyle,width:getComputedStyle(e).borderTopWidth})")
    assert style=={"top":"dashed","width":"1px"}
    assert page.locator(".court-net").is_hidden()
    assert not errors; page.close()
