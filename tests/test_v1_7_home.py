"""Home-screen acceptance for the implementation request and supplied artwork."""
from helpers import APP_URI, ROOT, base_match


def test_reference_artwork_home_navigation_and_continue_summary(browser):
    assert (ROOT / "Font_app_ref.jpg").exists()
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear()")
    page.reload()
    assert "Font_app_ref.jpg" in page.locator("#homeScreen").evaluate("e => getComputedStyle(e).backgroundImage")
    assert page.locator("#homeTitle").inner_text() == "VolleyLive Insight"
    assert page.locator("#homeOpen .home-main").inner_text() == "OPEN ARCHIVES"
    assert page.locator("#homeTeams").count() == 1
    assert page.locator("#homeSettings").count() == 1
    assert page.get_by_text("STATISTICS", exact=True).count() == 0
    assert page.locator("#homeContinue").is_disabled()

    page.evaluate("""m => {
      localStorage.setItem('volleyCapture.match.v1', JSON.stringify(m));
      localStorage.setItem('volleyCapture.events.v1', '[]');
      localStorage.setItem('volleyCapture.chartData.v1', '[]');
    }""", base_match())
    page.reload()
    assert not page.locator("#homeContinue").is_disabled()
    info = page.locator("#homeContinueInfo").inner_text()
    assert "Antibes vs Nice" in info and "SET 1" in info
    assert page.locator("#homeLast").count() == 0
    assert not errors
    page.close()
