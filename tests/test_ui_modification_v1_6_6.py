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
    assert page.inner_text("#captureUndo")=="UNDO" and page.inner_text("#historyToggle").startswith("HISTORY")
    assert not errors; page.close()


def test_action_families_and_likely_state_are_distinct(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    page.click('.court-grid [data-player="3"]')
    expected={"attack":"rgb(113, 56, 21)","reception":"rgb(20, 83, 45)","service":"rgb(12, 74, 110)"}
    for action,color in expected.items(): assert style(page.locator(f'[data-quick-action="{action}"]'),["backgroundColor"])["backgroundColor"]==color
    assert style(page.locator('[data-quick-action="set"]'),["opacity"])["opacity"]=="0.48"
    assert style(page.locator('[data-quick-action="attack"]'),["opacity"])["opacity"]=="1"
    assert not errors; page.close()
