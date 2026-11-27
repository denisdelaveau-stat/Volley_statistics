"""Interface language: French by default, English chosen in Settings, kept after a reload."""
from __future__ import annotations

from helpers import APP_URI

UI_LANGUAGE = None  # this module tests the language choice itself


def open_settings(page):
    page.click("#homeSettings")
    page.wait_for_timeout(100)


def test_french_by_default_and_english_from_settings(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    assert page.evaluate("document.documentElement.lang") == "fr"
    open_settings(page)
    assert page.locator("#settingsScreen h2").inner_text() == "Réglages"
    assert page.locator('[data-setting-language="fr"]').get_attribute("aria-pressed") == "true"

    page.click('[data-setting-language="en"]')
    with page.expect_navigation():
        page.click("#settingsSave")
    page.wait_for_timeout(200)
    assert page.evaluate("document.documentElement.lang") == "en"
    assert page.evaluate("JSON.parse(localStorage.getItem('volleyLive.language.v1'))") == "en"
    open_settings(page)
    assert page.locator("#settingsScreen h2").inner_text() == "Settings"
    assert page.locator("#settingsSave").inner_text() == "SAVE SETTINGS"
    assert "Match format" in page.locator("#settingsBody").inner_text()
    assert page.locator('[data-setting-language="en"]').get_attribute("aria-pressed") == "true"

    page.click('[data-setting-format="2"]')
    page.click("#settingsSave")
    assert page.locator("#settingsMsg").inner_text() == "Settings saved."
    assert not errors
    page.close()
