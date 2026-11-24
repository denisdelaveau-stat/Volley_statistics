"""Coach-interface acceptance for Volley Live Capture v1.8.0."""
from helpers import APP_URI, base_match


def _seed(page):
    match = base_match("advanced", focus_off=())
    match["currentSet"] = 1
    events = [
        {"id": 1, "set": 1, "player": 3, "action": "reception", "result": "neutral", "winningTeam": None, "scoreA": 0, "scoreB": 0},
        {"id": 2, "set": 1, "player": 3, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 1, "scoreB": 0},
        {"id": 3, "set": 1, "player": 5, "action": "service", "result": "error", "winningTeam": "team2", "scoreA": 1, "scoreB": 1},
        {"id": 4, "set": 1, "player": 5, "action": "reception", "result": "neutral", "winningTeam": None, "scoreA": 1, "scoreB": 1},
        {"id": 5, "set": 1, "player": 5, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 2, "scoreB": 1},
        {"id": 6, "set": 1, "player": 4, "action": "block", "result": "point", "winningTeam": "team1", "scoreA": 3, "scoreB": 1},
    ]
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        {"match": match, "events": events},
    )
    page.reload()


def test_coach_navigation_live_data_and_player_detail(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    _seed(page)

    assert page.locator("#insightsCoach strong").inner_text() == "COACH VIEW"
    page.evaluate("window.VolleyCoach.open()")
    assert page.locator("#coachScreen").is_visible()
    assert page.locator("#coachContent .coach-title").inner_text().startswith("Vue coach")
    assert "ANTIBES" in page.locator("#coachContent .coach-score").inner_text()
    assert page.locator("#coachContent .coach-kpi").count() == 6

    page.locator('[data-coach-tab="rotations"]').click()
    assert page.locator("#coachContent .coach-title").inner_text().startswith("Analyse des rotations")
    assert page.locator("#coachContent .rotation-tabs button").count() == 6
    page.locator('[data-rotation="p4"]').click()
    assert page.locator('[data-rotation="p4"]').get_attribute("class") == "active"

    page.locator('[data-coach-tab="players"]').click()
    assert page.locator("#coachContent .coach-title").inner_text().startswith("Performance joueurs")
    assert "Voir le détail joueur" in page.locator("#playerDetailCta").inner_text()
    page.set_viewport_size({"width": 844, "height": 390})
    page.locator("#playerDetailCta").click()
    page.wait_for_timeout(130)
    assert page.locator("#coachContent .player-focus-view").is_visible()
    assert page.locator('[data-focus-court]').count() == 1
    assert not errors
    page.close()


def test_coach_empty_state_and_accessible_detail(browser):
    page = browser.new_page(viewport={"width": 320, "height": 760})
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    page.evaluate("window.VolleyCoach.open()")
    assert page.locator("#coachLiveLabel").inner_text() == "AUCUN MATCH"
    assert "Aucun match chargé" in page.locator("#coachContent").inner_text()
    assert "as cannes" not in page.locator("#coachContent").inner_text().lower()
    page.locator('[data-coach-tab="players"]').click()
    cta = page.locator("[data-empty-detail]")
    assert cta.is_visible()
    page.set_viewport_size({"width": 844, "height": 390})
    cta.click()
    assert page.locator("#coachContent .player-focus-view").is_visible()
    assert "NA" in page.locator("#coachContent").inner_text()
    page.close()


def test_coach_courts_use_shared_saturated_role_palette(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    match = base_match("advanced", focus_off=())
    match["currentSet"] = 1
    # Put all five roster roles on the six-player court for palette validation.
    match["startingRotation"] = {"p1": 1, "p2": 7, "p3": 4, "p4": 3, "p5": 2, "p6": 5}
    events = [{"id": 1, "set": 1, "player": 3, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 1, "scoreB": 0}]
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        {"match": match, "events": events},
    )
    page.reload()
    page.evaluate("window.VolleyCoach.open()")
    expected = {
        "opp": ("rgb(79, 168, 232)", "rgb(10, 53, 85)"),
        "setter": ("rgb(242, 201, 76)", "rgb(74, 54, 0)"),
        "oh": ("rgb(235, 111, 122)", "rgb(80, 20, 27)"),
        "mb": ("rgb(99, 201, 133)", "rgb(18, 61, 36)"),
        "libero": ("rgb(154, 165, 177)", "rgb(38, 49, 61)"),
    }
    for role, (background, foreground) in expected.items():
        dot = page.locator(f'.coach-player-dot[data-player-role="{role}"]').first
        assert dot.count() == 1
        number = dot.locator('.number')
        assert number.evaluate("e => getComputedStyle(e).backgroundColor") == background
        assert number.evaluate("e => getComputedStyle(e).color") == foreground
        assert dot.locator('.name').evaluate("e => getComputedStyle(e).color") == "rgb(6, 27, 48)"
    # Rotation analysis reuses the exact same court renderer and palette.
    page.locator('[data-coach-tab="rotations"]').click()
    assert page.locator('.coach-player-dot[data-player-role]').count() == 6
    assert page.locator('.coach-court').evaluate("e => getComputedStyle(e).backgroundImage").find('rgb(255, 156, 85)') >= 0
    assert not errors
    page.close()
