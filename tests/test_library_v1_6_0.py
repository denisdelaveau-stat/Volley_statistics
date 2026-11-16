"""Non-regression checks for the v1.5 setup library retained in v1.6.0."""
from helpers import APP_URI


def test_saved_team_library_and_rotate_plus_one(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.click("#homeNew")
    page.fill("#suTeam", "Antibes")
    page.fill("#suOpp", "Nice")
    for number in range(1, 9):
        page.click(f'[data-n="{number}"]')
        page.fill(f'[data-iname="{number}"]', f'Player {number}')
    page.fill('[data-libname="team"]', "Antibes U18")
    page.click('[data-libsave="team"]')
    library = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")
    assert library["team"]["Antibes U18"]["roster"] == list(range(1, 9))

    page.click("#suNext")
    assignments = {"oh1": 3, "oh2": 5, "mb1": 4, "mb2": 6, "setter": 1, "opp": 7, "libero": 2}
    for slot, number in assignments.items():
        page.click(f'[data-slot="{slot}"]')
        page.click(f'[data-pick="{number}"]')
    page.click("#suNext")
    rotation = {"p1": 1, "p2": 3, "p3": 4, "p4": 7, "p5": 5, "p6": 6}
    for position, number in rotation.items():
        page.click(f'[data-pos="{position}"]')
        page.click(f'[data-rpick="{number}"]')
    page.click("#suRotate")
    assert page.evaluate("window.__S.rot") == {"p1": 3, "p2": 4, "p3": 7, "p4": 5, "p5": 6, "p6": 1}
    for _ in range(5):
        page.click("#suRotate")
    assert page.evaluate("window.__S.rot") == rotation
    assert not errors
    page.close()
