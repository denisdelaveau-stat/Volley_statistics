"""Home shell and dedicated Match Hub regression coverage for v1.23.0."""
from helpers import APP_URI, ROOT, base_match


def test_home_menu_opens_dedicated_match_hub_and_preserves_all_sections(browser):
    assert (ROOT / "Font_app_ref.jpg").exists()
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    assert "Font_app_ref.jpg" in page.locator("#homeScreen").evaluate("e => getComputedStyle(e).backgroundImage")
    assert page.locator("#homeTitle").inner_text() == "VolleyLive Insight"
    assert page.locator("#matchHubScreen").is_hidden()
    assert page.locator(".home-menu-card .home-main").all_inner_texts() == [
        "MATCH HUB", "COACH VIEW", "TEAMS MANAGEMENT", "ADVANCED STATISTICS", "SETTINGS"
    ]
    page.locator("#homeMatchHub").click()
    assert page.locator("#homeScreen").is_hidden()
    assert page.locator("#matchHubScreen").is_visible()
    assert page.locator("#matchHubTitle").inner_text() == "MATCH HUB"
    assert page.locator("#homeOpen .mh-title").inner_text() == "VIEW MATCH"
    assert page.locator("#homeContinue").is_disabled()
    page.locator("#matchHubBack").click()
    assert page.locator("#homeScreen").is_visible()
    assert page.evaluate("document.activeElement && document.activeElement.id") == "homeMatchHub"
    assert not errors
    page.close()


def test_match_hub_continue_summary_uses_current_match(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    match = base_match()
    match["updatedAt"] = "2026-11-23T18:30:00Z"
    page.evaluate(
        """m => {
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(m));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify([
            {set:1, action:'attack', result:'point', winningTeam:'team1', scoreA:1, scoreB:0}
          ]));
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        match,
    )
    page.reload()
    page.locator("#homeMatchHub").click()
    assert not page.locator("#homeContinue").is_disabled()
    assert page.locator("#homeContinueInfo").inner_text() == "Resume your match in progress"
    summary = page.locator("#matchHubActiveSummary").inner_text()
    assert "Antibes vs Nice" in summary and "Set 1" in summary and "1 – 0" in summary
    assert not errors
    page.close()


def test_home_and_match_hub_are_responsive_without_horizontal_scroll(browser):
    for viewport in ({"width": 320, "height": 568}, {"width": 390, "height": 844}, {"width": 768, "height": 1024}):
        page = browser.new_page(viewport=viewport)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(APP_URI)
        page.evaluate("localStorage.clear(); sessionStorage.clear()")
        page.reload()
        home_metrics = page.locator("#homeScreen").evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
        assert home_metrics["scroll"] <= home_metrics["client"] + 1
        assert page.locator(".home-menu-card").count() == 5
        for selector in ("#homeMatchHub", "#homeCoach", "#homeTeams", "#homeStatistics", "#homeSettings"):
            assert page.locator(selector).evaluate("e => e.getBoundingClientRect().height") >= 44
        page.locator("#homeMatchHub").click()
        hub_metrics = page.locator("#matchHubScreen").evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
        assert hub_metrics["scroll"] <= hub_metrics["client"] + 1
        assert page.locator(".match-hub-card").count() == 3
        for selector in ("#matchHubBack", "#homeNew", "#homeContinue", "#homeOpen", "#matchHubImport"):
            assert page.locator(selector).evaluate("e => e.getBoundingClientRect().height") >= 44
        assert not errors
        page.close()
