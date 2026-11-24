"""Deterministic responsive visual checks for v1.25.0 navigation."""
from pathlib import Path
from PIL import Image, ImageStat
from helpers import APP_URI


def open_empty(browser, viewport):
    page = browser.new_page(viewport=viewport)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    return page, errors


def assert_in_view(page, selector):
    box = page.locator(selector).bounding_box()
    viewport = page.viewport_size
    assert box and box["x"] >= -1 and box["y"] >= -1
    assert box["x"] + box["width"] <= viewport["width"] + 1
    assert box["width"] >= 44 and box["height"] >= 44


def test_home_visual_geometry_at_phone_tablet_and_landscape(browser, tmp_path):
    for name, viewport in {
        "phone": {"width": 390, "height": 844},
        "tablet": {"width": 768, "height": 1024},
        "landscape": {"width": 844, "height": 390},
    }.items():
        page, errors = open_empty(browser, viewport)
        for selector in ("#homeSetupCapture", "#homeInsights", "#homeSettings"):
            assert_in_view(page, selector)
        boxes = [page.locator(selector).bounding_box() for selector in ("#homeSetupCapture", "#homeInsights", "#homeSettings")]
        assert len({(round(b["x"]), round(b["y"])) for b in boxes}) == 3
        path = tmp_path / f"home_{name}.png"
        page.screenshot(path=str(path), full_page=False)
        image = Image.open(path).convert("RGB")
        assert image.size == (viewport["width"], viewport["height"])
        assert max(ImageStat.Stat(image).stddev) > 25
        assert not errors
        page.close()


def test_write_and_read_navigation_have_distinct_non_semantic_accents(browser):
    page, errors = open_empty(browser, {"width": 390, "height": 844})
    write = page.locator("#homeSetupCapture").evaluate("e => getComputedStyle(e).borderTopColor")
    read = page.locator("#homeInsights").evaluate("e => getComputedStyle(e).borderTopColor")
    assert write != read
    forbidden = {"rgb(255, 0, 0)", "rgb(0, 128, 0)", "rgb(255, 255, 0)"}
    assert write not in forbidden and read not in forbidden
    page.locator("#homeSetupCapture").click()
    assert page.locator("#setupCaptureScreen").evaluate("e => e.scrollWidth <= e.clientWidth + 1")
    page.locator("#setupCaptureBack").click(); page.locator("#homeInsights").click()
    assert page.locator("#insightsScreen").evaluate("e => e.scrollWidth <= e.clientWidth + 1")
    assert not errors
    page.close()


def test_match_library_card_actions_fit_phone_and_tablet(browser):
    for viewport in ({"width": 390, "height": 844}, {"width": 768, "height": 1024}):
        page, errors = open_empty(browser, viewport)
        match = {"id":"visual","name":"Home_vs_Away","status":"paused","currentSet":1,"team":{"name":"Home","roster":[]},"opponent":{"name":"Away"},"startingLineup":{},"startingRotation":{},"firstRally":{},"format":{},"subs":[]}
        page.evaluate("m=>{localStorage.setItem('volleyCapture.match.v1',JSON.stringify(m));localStorage.setItem('volleyCapture.events.v1','[]');localStorage.setItem('volleyCapture.chartData.v1','[]')}", match)
        page.reload(); page.locator("#homeInsights").click(); page.locator("#insightsMatchLibrary").click()
        assert_in_view(page, ".library-card")
        assert page.locator(".library-actions button").evaluate_all("els => els.every(e => e.getBoundingClientRect().height >= 44)")
        assert page.locator("#matchLibraryScreen").evaluate("e => e.scrollWidth <= e.clientWidth + 1")
        assert not errors
        page.close()
