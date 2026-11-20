"""Advanced Statistics acceptance with the unified VolleyLive v2.1 fixture."""
from helpers import APP_URI, base_match


def test_home_button_opens_reference_statistics(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()

    button = page.locator("#homeStatistics")
    assert button.is_visible()
    assert button.locator(".home-main").inner_text() == "ADVANCED STATISTICS"
    button.click()
    page.wait_for_selector("#statsLoader", state="hidden")

    assert "As cannes" in page.locator("#statsMatchTitle").inner_text()
    assert "Référence v2.1" in page.locator("#dataStatusTitle").inner_text()
    assert "volley-live v2.1.0" in page.locator("#dataStatusSummary").inner_text()
    assert page.locator("#set option").count() == 3
    assert page.locator("#rmPlayer option").count() == 11
    assert page.locator("#view .vertical-table tbody tr").count() == 364
    assert page.locator("#individualPlayers option").filter(has_text="#20 Zak").count() == 1
    assert not errors
    page.close()


def test_statistics_reads_current_capture_store(browser):
    page = browser.new_page(viewport={"width": 820, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    match = base_match("advanced", focus_off=())
    events = [
        {"id": 1, "set": 1, "player": 3, "action": "reception", "result": "neutral", "winningTeam": None, "scoreA": 0, "scoreB": 0},
        {"id": 2, "set": 1, "player": 1, "action": "set", "result": "neutral", "winningTeam": None, "scoreA": 0, "scoreB": 0},
        {"id": 3, "set": 1, "player": 3, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 1, "scoreB": 0},
    ]
    page.evaluate(
        """payload => {
          localStorage.clear(); sessionStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        {"match": match, "events": events},
    )
    page.goto(APP_URI.replace("index.html", "statistics/index.html"))
    page.wait_for_selector("#statsLoader", state="hidden")

    assert page.locator("#dataStatusTitle").inner_text() == "Source : Match courant de Volley Live Capture"
    assert "Antibes vs Nice" in page.locator("#statsMatchTitle").inner_text()
    assert page.locator("#view .vertical-table tbody tr").count() == 3
    assert page.locator("#mc").inner_text() == "3"
    assert page.locator("#mr").inner_text() == "1"
    assert not errors
    page.close()
