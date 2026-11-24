"""v1.26.0 Home, workspace hierarchy, and responsive navigation acceptance."""
from helpers import APP_URI, ROOT, base_match


def open_empty(browser, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    return page, errors


def test_home_separates_write_and_read_workspaces_and_keeps_settings():
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'id="homeSetupCapture"' in home
    assert 'id="homeInsights"' in home
    assert 'id="homeSettings"' in home
    assert "ADVANCED STATISTICS" not in home
    assert 'id="homeStatistics"' not in home
    assert not (ROOT / "statistics/index.html").exists()


def test_home_workspace_navigation_and_back_paths(browser):
    page, errors = open_empty(browser)
    assert "Font_app_ref.jpg" in page.locator("#homeScreen").evaluate("e => getComputedStyle(e).backgroundImage")
    assert page.locator("#homeTitle").inner_text() == "VolleyLive Insight"
    assert page.locator("#homeScreen .home-main").all_inner_texts() == [
        "SETUP & CAPTURE", "INSIGHTS & VIEWING", "SETTINGS"
    ]
    assert page.locator("#appVersion").inner_text() == "v1.26.1"

    page.locator("#homeSetupCapture").click()
    assert page.locator("#setupCaptureTitle").inner_text() == "SETUP & CAPTURE"
    assert page.locator("#setupCaptureScreen .navigation-mode").inner_text() == "WRITE ACCESS"
    assert page.locator("#setupCaptureScreen .navigation-card strong").all_inner_texts() == ["MATCH CAPTURE", "TEAM MANAGEMENT"]
    page.locator("#setupMatchCapture").click()
    assert page.locator("#matchHubTitle").inner_text() == "MATCH CAPTURE"
    assert page.locator(".match-hub-card .mh-title").all_inner_texts() == ["NEW MATCH", "CONTINUE CAPTURE"]
    page.locator("#matchHubBack").click()
    page.locator("#setupCaptureBack").click()

    page.locator("#homeInsights").click()
    assert page.locator("#insightsTitle").inner_text() == "INSIGHTS & VIEWING"
    assert page.locator("#insightsScreen .navigation-mode").inner_text() == "READ ONLY"
    assert page.locator("#insightsScreen .navigation-card strong").all_inner_texts() == [
        "MATCH LIBRARY", "COACH VIEW", "SPECTATOR VIEW", "MATCH REPORTS"
    ]
    page.locator("#insightsBack").click()
    assert page.locator("#homeScreen").is_visible()
    assert not errors
    page.close()


def test_match_capture_continue_summary_uses_current_official_match(browser):
    page, errors = open_empty(browser)
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
    page.locator("#homeSetupCapture").click()
    page.locator("#setupMatchCapture").click()
    assert not page.locator("#homeContinue").is_disabled()
    assert page.locator("#homeContinueInfo").inner_text() == "Resume official data entry"
    summary = page.locator("#matchHubActiveSummary").inner_text()
    assert "Antibes vs Nice" in summary and "Set 1" in summary and "1 – 0" in summary
    assert not errors
    page.close()


def test_home_workspaces_library_and_landscape_are_responsive_with_touch_targets(browser):
    viewports = ({"width": 390, "height": 844}, {"width": 768, "height": 1024}, {"width": 844, "height": 390})
    for viewport in viewports:
        page, errors = open_empty(browser, viewport)
        home = page.locator("#homeScreen").evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
        assert home["scroll"] <= home["client"] + 1
        for selector in ("#homeSetupCapture", "#homeInsights", "#homeSettings"):
            assert page.locator(selector).evaluate("e => e.getBoundingClientRect().height") >= 44
        page.locator("#homeInsights").click()
        insights = page.locator("#insightsScreen").evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
        assert insights["scroll"] <= insights["client"] + 1
        page.locator("#insightsMatchLibrary").click()
        library = page.locator("#matchLibraryScreen").evaluate("e => ({client:e.clientWidth, scroll:e.scrollWidth})")
        assert library["scroll"] <= library["client"] + 1
        for selector in ("#matchLibraryBack", "[data-library-filter=active]", "[data-library-filter=finished]", "[data-library-filter=imported]", "#matchLibraryImport"):
            assert page.locator(selector).evaluate("e => e.getBoundingClientRect().height") >= 44
        assert not errors
        page.close()
