"""v1.12 three-level input grammar and substitution acceptance."""
from helpers import events,open_match,wait_guard


def test_player_direct_result_and_home_away_direct_result(browser):
    page, errors=open_match(browser,"intermediate",focus_off=())
    assert page.locator("[data-quick-side]").count()==2
    focus=page.locator('.court-grid [data-zone="p2"]'); focus.click()
    assert page.locator("#quickMode").count()==0
    page.click('[data-quick-result="point"]'); assert (events(page)[-1]["player"],events(page)[-1]["action"])==(3,"generic")
    wait_guard(page); page.click('[data-quick-result="error"]'); page.click('[data-quick-side="A"]')
    assert (events(page)[-1]["player"],events(page)[-1]["action"],events(page)[-1]["winningTeam"])==("A","adverse","team1")
    assert page.locator(".bench-row > #subToggle").count()==1 and not errors; page.close()


def test_complete_player_action_result_and_free_ball(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    page.click('.court-grid [data-zone="p2"]'); page.click('[data-quick-action="attack"]'); page.click('[data-quick-result="point"]')
    assert (events(page)[-1]["player"],events(page)[-1]["action"],events(page)[-1]["result"])==(3,"attack","point")
    wait_guard(page); page.click('.court-grid [data-zone="p2"]'); page.click('[data-quick-action="freeball"]'); page.click('[data-quick-result="neutral"]')
    assert events(page)[-1]["action"]=="freeball" and not errors; page.close()
