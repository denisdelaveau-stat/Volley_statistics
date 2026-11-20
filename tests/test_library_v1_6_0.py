"""Acceptance tests for the v1.7 single-screen Teams library."""
from helpers import APP_URI


def test_single_screen_team_editor_saves_reusable_team(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.click("#homeTeams")
    assert page.locator("#teamsScreen").is_visible()
    assert page.locator("#suTeam, #suOpp, #suName, #suLevel").count() == 0
    for _ in range(7):
        page.click("#teamAdd")
    roles = ("setter", "libero", "oh", "mb", "oh", "mb", "opp")
    for index, role in enumerate(roles):
        page.fill(f'[data-team-name="{index}"]', f"Player {index + 1}")
        page.click(f'[data-team-role="{index}:{role}"]')
    page.fill("#teamName", "Antibes U18")
    page.click("#teamsSave")
    library = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")
    saved = library["team"]["Antibes U18"]
    assert saved["roster"] == list(range(1, 8))
    assert saved["info"]["1"]["pos"] == "setter"
    assert saved["info"]["7"]["pos"] == "opp"
    assert "focus" not in saved["info"]["1"]
    assert page.locator("[data-ifocus]").count() == 0
    assert not errors
    page.close()
