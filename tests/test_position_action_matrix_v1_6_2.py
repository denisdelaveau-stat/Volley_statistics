"""v1.11 likely-action guidance by player position."""
from helpers import events, open_match, wait_guard

MATRIX={"setter":{"attack","block","defense","service","set","freeball"},"oh":{"attack","block","defense","reception","service","freeball"},"opp":{"attack","block","defense","service","freeball"},"mb":{"attack","block","defense","service","freeball"},"libero":{"defense","reception","set","freeball"}}
SELECTORS={"setter":'.court-grid [data-player="1"]',"oh":'.court-grid [data-player="3"]',"opp":'.court-grid [data-player="7"]',"mb":'.court-grid [data-player="4"]',"libero":'.court-grid [data-player="2"]'}
ALL={"attack","block","defense","reception","service","set","freeball"}


def states(page):
    return page.locator("[data-adv-row]").evaluate_all("es=>Object.fromEntries(es.map(e=>[e.dataset.advRow,e.dataset.advState]))")


def test_all_positions_apply_guidance_and_keep_free_ball(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    assert set(page.locator("[data-adv-row]").evaluate_all("es=>es.map(e=>e.dataset.advRow)")) == ALL
    for position,selector in SELECTORS.items():
        page.click(selector); st=states(page); blocked={"attack","block","service"} if position=="libero" else set()
        assert {a for a,v in st.items() if v=="expected"} == MATRIX[position]
        assert {a for a,v in st.items() if v=="blocked"} == blocked
        assert {a for a,v in st.items() if v=="rare"} == ALL-MATRIX[position]-blocked
        page.click(selector)
    assert not errors; page.close()


def test_rare_actions_tappable_and_libero_prohibitions_blocked(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    page.click(SELECTORS["setter"]); assert page.locator('[data-quick-action="reception"]').get_attribute("data-adv-state") == "rare"
    page.click('[data-quick-action="reception"]'); page.click('[data-quick-result="neutral"]')
    assert (events(page)[-1]["action"],events(page)[-1]["result"]) == ("reception","neutral")
    wait_guard(page); page.click(SELECTORS["libero"]); before=len(events(page))
    for action in ("attack","block","service"):
        b=page.locator(f'[data-quick-action="{action}"]'); assert b.is_disabled(); assert b.get_attribute("data-adv-state") == "blocked"
    assert len(events(page))==before and not errors; page.close()
