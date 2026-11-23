"""Home shell regression coverage retained after the v1.21.0 Match Hub redesign."""
from helpers import APP_URI, ROOT, base_match


def test_home_shell_match_hub_and_continue_summary(browser):
    assert (ROOT / "Font_app_ref.jpg").exists()
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    assert "Font_app_ref.jpg" in page.locator("#homeScreen").evaluate("e => getComputedStyle(e).backgroundImage")
    assert page.locator("#homeTitle").inner_text() == "VolleyLive Insight"
    assert page.locator("#matchHubTitle").inner_text() == "MATCH HUB"
    assert page.locator("#homeOpen .mh-title").inner_text() == "VIEW MATCH"
    assert page.locator("#homeTeams").count() == 1
    assert page.locator("#homeSettings").count() == 1
    assert page.get_by_text("STATISTICS", exact=True).count() == 0
    assert page.locator("#homeContinue").is_disabled()

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
    assert not page.locator("#homeContinue").is_disabled()
    assert page.locator("#homeContinueInfo").inner_text() == "Resume your match in progress"
    summary = page.locator("#matchHubActiveSummary").inner_text()
    assert "Antibes vs Nice" in summary and "Set 1" in summary and "1 – 0" in summary
    assert not errors
    page.close()


def test_home_match_hub_responsive_without_horizontal_scroll(browser):
    for viewport in ({"width": 320, "height": 568}, {"width": 390, "height": 844}, {"width": 768, "height": 1024}):
        page = browser.new_page(viewport=viewport)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(APP_URI)
        page.evaluate("localStorage.clear(); sessionStorage.clear()")
        page.reload()
        metrics = page.locator("#homeScreen").evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
        assert metrics["scroll"] <= metrics["client"] + 1
        assert page.locator(".match-hub-card").count() == 3
        for selector in ("#homeNew", "#homeContinue", "#homeOpen", "#matchHubImport"):
            assert page.locator(selector).evaluate("e => e.getBoundingClientRect().height") >= 44
        assert not errors
        page.close()
