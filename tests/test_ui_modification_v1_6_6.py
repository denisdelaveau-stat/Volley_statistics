"""v1.12 quick-entry layout and semantic-colour acceptance."""
from helpers import open_match


def style(locator,props):
    return locator.evaluate("(e,p)=>Object.fromEntries(p.map(x=>[x,getComputedStyle(e)[x]]))",props)


def test_score_sides_quick_pad_player_tray_undo_and_history(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    score=page.locator("#liveScore").bounding_box(); pad=page.locator(".quick-entry").bounding_box(); tray=page.locator(".quick-player-tray").bounding_box()
    assert score["y"] < pad["y"] < tray["y"]
    assert page.locator(".quick-side-selector").is_hidden()
    assert page.locator("[data-quick-side]").count()==2 and page.locator("[data-quick-result]").count()==3 and page.locator("[data-quick-action]").count()==7
    assert page.locator(".court-grid [data-player]").count()==6
    assert page.locator(".court-grid").evaluate("e=>getComputedStyle(e).gridTemplateColumns.split(' ').length")==3
    undo=page.locator("#captureUndo").bounding_box()
    assert page.inner_text("#captureUndo")=="↶" and undo["x"]>score["x"]+score["width"]
    assert page.inner_text("#historyToggle").startswith("HISTORY")
    assert not errors; page.close()


def test_reference_actions_share_blue_style_and_likely_state_is_distinct(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    page.click('.court-grid [data-player="3"]')
    for action in ("attack","reception","service"):
        assert style(page.locator(f'[data-quick-action="{action}"]'),["backgroundColor"])["backgroundColor"]=="rgb(18, 59, 96)"
    assert style(page.locator('[data-quick-action="set"]'),["opacity"])["opacity"]=="0.48"
    assert style(page.locator('[data-quick-action="attack"]'),["opacity"])["opacity"]=="1"
    assert not errors; page.close()
