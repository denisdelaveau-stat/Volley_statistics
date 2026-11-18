"""v1.6.2 Advanced action guidance by player position."""
from helpers import events, open_match, wait_guard


MATRIX = {
    "setter": {"attack", "block", "defense", "service", "set"},
    "oh": {"attack", "block", "defense", "reception", "service"},
    "opp": {"attack", "block", "defense", "service"},
    "mb": {"attack", "block", "defense", "service"},
    "libero": {"defense", "reception", "set"},
}

SELECTORS = {
    "setter": '.court-grid [data-player="1"]',
    "oh": '.court-grid [data-player="3"]',
    "opp": '.court-grid [data-player="7"]',
    "mb": '.court-grid [data-player="4"]',
    "libero": '.court-grid [data-player="2"]',
}

ALL_ACTIONS = {"attack", "block", "defense", "reception", "service", "set"}


def row_states(page):
    return page.locator("[data-adv-row]").evaluate_all(
        "els => Object.fromEntries(els.map(e => [e.dataset.advRow, e.dataset.advState]))"
    )


def test_all_positions_keep_fixed_order_and_apply_guidance(browser):
    page, errors = open_match(browser, "advanced", focus_off=())
    expected_order = ["attack", "block", "defense", "reception", "service", "set"]

    for position, selector in SELECTORS.items():
        page.click(selector)
        rows = page.locator("[data-adv-row]")
        assert rows.evaluate_all("els => els.map(e => e.dataset.advRow)") == expected_order
        states = row_states(page)
        blocked = {"attack", "block", "service"} if position == "libero" else set()
        assert {a for a, state in states.items() if state == "expected"} == MATRIX[position]
        assert {a for a, state in states.items() if state == "blocked"} == blocked
        assert {a for a, state in states.items() if state == "rare"} == ALL_ACTIONS - MATRIX[position] - blocked
        assert page.locator('[data-adv-state="blocked"] button:not(:disabled)').count() == 0
        page.click("#captureBack")

    assert not errors
    page.close()


def test_rare_legal_actions_remain_tappable_but_libero_prohibitions_are_blocked(browser):
    page, errors = open_match(browser, "advanced", focus_off=())

    # Reception is not expected for a Setter but remains a legal, tappable action.
    page.click(SELECTORS["setter"])
    assert page.locator('[data-adv-row="reception"]').get_attribute("data-adv-state") == "rare"
    page.click('[data-adv-row="reception"] [data-adv-result="neutral"]')
    assert (events(page)[-1]["player"], events(page)[-1]["action"], events(page)[-1]["result"]) == (1, "reception", "neutral")

    wait_guard(page)
    # A rare OH set also remains available.
    page.click(SELECTORS["oh"])
    assert page.locator('[data-adv-row="set"]').get_attribute("data-adv-state") == "rare"
    page.click('[data-adv-row="set"] [data-adv-result="neutral"]')
    assert (events(page)[-1]["player"], events(page)[-1]["action"], events(page)[-1]["result"]) == (3, "set", "neutral")

    wait_guard(page)
    page.click(SELECTORS["libero"])
    before = len(events(page))
    for action in ("attack", "block", "service"):
        row = page.locator(f'[data-adv-row="{action}"]')
        assert row.get_attribute("data-adv-state") == "blocked"
        assert row.get_attribute("aria-disabled") == "true"
        assert row.locator("button:disabled").count() >= 2
        page.evaluate(
            """action => document.querySelector(`[data-adv-row="${action}"] [data-adv-result="error"]`)
                .dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true}))""",
            action,
        )
    assert len(events(page)) == before

    assert not errors
    page.close()
