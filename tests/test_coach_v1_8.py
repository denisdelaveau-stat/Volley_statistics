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

    assert page.locator("#homeCoach .home-main").inner_text() == "COACH VIEW"
    page.locator("#homeCoach").click()
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
    page.locator("#playerDetailCta").click()
    page.wait_for_timeout(130)
    assert page.locator("#coachContent .coach-title").inner_text().startswith("Détail joueur")
    assert page.locator('[data-detail-back]').count() == 1
    assert not errors
    page.close()


def test_coach_reference_v2_state_and_accessible_cta(browser):
    page = browser.new_page(viewport={"width": 320, "height": 760})
    page.goto(APP_URI)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.locator("#homeCoach").click()
    assert page.locator("#coachLiveLabel").inner_text() == "V2.1 RÉF"
    assert "as cannes" in page.locator("#coachContent .coach-score").inner_text().lower()
    page.locator('[data-coach-tab="players"]').click()
    cta = page.locator("#playerDetailCta")
    assert cta.is_visible()
    assert "Voir le détail du joueur numéro" in cta.get_attribute("aria-label")
    page.close()
