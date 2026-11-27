"""Match Hub "Save current & start another": the current match is cleared only once it has been saved."""
from __future__ import annotations

from helpers import APP_URI, base_match

UI_LANGUAGE = "en"  # assertions below use the English interface


def open_home_with_active_match(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, accept_downloads=True)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate(
        """match => {
          localStorage.clear();
          sessionStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(match));
          localStorage.setItem('volleyCapture.events.v1', '[]');
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
        }""",
        base_match(()),
    )
    page.reload()
    page.wait_for_timeout(200)
    page.click("#homeSetupCapture")
    page.click("#setupMatchCapture")
    page.wait_for_timeout(100)
    page.click("#homeNew")
    page.wait_for_timeout(100)
    return page, errors


def test_save_failure_keeps_the_current_match(browser):
    page, errors = open_home_with_active_match(browser)
    assert page.locator("#matchHubDecision").is_visible()
    # Simulate a full storage when the match is added to the history.
    page.evaluate(
        """() => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (key, value) {
            if (key === 'volleyMatchHub.history.v1') throw new Error('QuotaExceededError');
            return original.call(this, key, value);
          };
        }"""
    )
    page.click("#matchHubSaveStart")
    page.wait_for_timeout(200)
    assert page.evaluate("localStorage.getItem('volleyCapture.match.v1')") is not None
    text = page.locator("#matchHubDecisionText").inner_text()
    assert "Save failed" in text and "QuotaExceededError" in text
    assert page.locator("#matchHubDecision").is_visible()
    assert not errors
    page.close()


def test_successful_save_archives_then_clears_the_current_match(browser):
    page, errors = open_home_with_active_match(browser)
    with page.expect_navigation():
        page.click("#matchHubSaveStart")
    page.wait_for_timeout(200)
    assert page.evaluate("localStorage.getItem('volleyCapture.match.v1')") is None
    history = page.evaluate("JSON.parse(localStorage.getItem('volleyMatchHub.history.v1') || '[]')")
    assert len(history) == 1
    assert not errors
    page.close()
