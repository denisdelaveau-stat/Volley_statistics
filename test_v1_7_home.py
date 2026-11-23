"""Home-screen and SPECTATOR VIEW acceptance for the supplied artwork."""
from PIL import Image, ImageChops, ImageStat

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
    assert page.locator("#homeOpen .home-main").inner_text() == "SPECTATOR VIEW"
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


def test_spectator_view_card_responsive_accessible_and_visual(browser, tmp_path):
    viewports = {
        "phone_390x844": {"width": 390, "height": 844},
        "tablet_768x1024": {"width": 768, "height": 1024},
        "landscape_844x390": {"width": 844, "height": 390},
    }
    for name, viewport in viewports.items():
        page = browser.new_page(viewport=viewport)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(APP_URI)
        page.evaluate("localStorage.clear(); sessionStorage.clear()")
        page.reload()
        card = page.locator("#homeOpen")
        card.scroll_into_view_if_needed()
        assert card.locator(".home-main").inner_text() == "SPECTATOR VIEW"
        assert card.locator("small").inner_text() == "SCORE - TIMELINE - GRAPH - RANKING"
        assert "Sélectionner une archive" in card.get_attribute("aria-label")
        assert card.locator(".home-eye").count() == 1
        assert card.locator(".home-chevron").inner_text() == "›"
        metrics = card.evaluate(
            """e => { const sub=e.querySelector('small'), title=e.querySelector('.home-main'), cs=getComputedStyle(e);
              const ss=getComputedStyle(sub); return {height:e.getBoundingClientRect().height, client:e.clientWidth, scroll:e.scrollWidth,
                titleClient:title.clientWidth,titleScroll:title.scrollWidth,subHeight:sub.scrollHeight,line:parseFloat(ss.lineHeight),
                border:cs.borderTopColor, background:cs.backgroundImage}; }"""
        )
        assert metrics["height"] >= 44
        assert metrics["scroll"] <= metrics["client"] + 1
        assert metrics["titleScroll"] <= metrics["titleClient"] + 1
        assert metrics["subHeight"] <= metrics["line"] * 2.2
        assert metrics["border"] == "rgb(110, 231, 255)"
        assert "linear-gradient" in metrics["background"]
        page.wait_for_timeout(150)
        actual = tmp_path / f"home_spectator_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / "tests" / "visual_baselines" / f"home_spectator_{name}_v1_20_0.png"
        assert baseline.exists(), f"Missing visual baseline {baseline.name}"
        observed, expected = Image.open(actual).convert("RGB"), Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        assert max(ImageStat.Stat(ImageChops.difference(expected, observed)).mean) < 3.0
        assert not errors
        page.close()
