"""Regression coverage for the reusable Teams library."""
from helpers import APP_URI


def test_team_management_editor_saves_reusable_team(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.click("#homeSetupCapture"); page.click("#setupTeamManagement")
    assert page.locator("#teamsScreen").is_visible()
    assert page.locator("#teamOverview").is_visible()
    page.click("#teamNew")
    assert page.locator("#teamEditor").is_visible()
    roles = ("setter", "libero", "oh", "mb", "oh", "mb", "opp")
    for index, role in enumerate(roles):
        page.fill("#teamPlayerNumber", str(index + 1))
        page.fill("#teamPlayerName", f"Player {index + 1}")
        page.select_option("#teamPlayerPosition", role)
        page.click("#teamAdd")
    page.fill("#teamName", "Antibes U18")
    page.click("#teamsSave")
    page.wait_for_function("() => !document.querySelector('#teamOverview').hidden")
    library = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")
    saved = library["team"]["Antibes U18"]
    assert saved["roster"] == list(range(1, 8))
    assert saved["info"]["1"]["pos"] == "setter"
    assert saved["info"]["7"]["pos"] == "opp"
    assert "focus" not in saved["info"]["1"]
    assert page.locator('[data-team-open="Antibes U18"]').is_visible()
    assert not errors
    page.close()
