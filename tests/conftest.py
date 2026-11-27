from pathlib import Path
import sys
import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from helpers import CHROMIUM

LANGUAGE_KEY = "volleyLive.language.v1"


@pytest.fixture(scope="session")
def _chromium():
    with sync_playwright() as playwright:
        executable_path = CHROMIUM if CHROMIUM and Path(CHROMIUM).exists() else None
        instance = playwright.chromium.launch(executable_path=executable_path, headless=True)
        yield instance
        instance.close()


class LanguageBrowser:
    """Chromium browser whose new pages open the app in a given interface language.

    French is the app default: nothing is written. For another language, the choice is written to localStorage
    after the first navigation and before every reload, unless the page already stored one (so a test can still
    switch the language from Settings). It is written the way the tests write their own data, never from an init
    script: a localStorage access at document start made the data a test writes just before a reload get lost,
    intermittently, on the Linux CI."""

    def __init__(self, browser, language):
        self._browser = browser
        self._language = language

    def _store_language(self, page):
        return page.evaluate(
            "([key, value]) => { if (localStorage.getItem(key)) return false;"
            " localStorage.setItem(key, JSON.stringify(value)); return true; }",
            [LANGUAGE_KEY, self._language],
        )

    def new_page(self, *args, **kwargs):
        page = self._browser.new_page(*args, **kwargs)
        if not self._language or self._language == "fr":
            return page
        goto, reload = page.goto, page.reload

        def goto_in_language(*a, **k):
            response = goto(*a, **k)
            if self._store_language(page):
                response = reload()
            return response

        def reload_in_language(*a, **k):
            self._store_language(page)
            return reload(*a, **k)

        page.goto, page.reload = goto_in_language, reload_in_language
        return page

    def __getattr__(self, name):
        return getattr(self._browser, name)


@pytest.fixture
def browser(_chromium, request):
    """Each test module may set UI_LANGUAGE = "en" or "fr" (French, the app default, when omitted).
    UI_LANGUAGE = None leaves the language untouched (tests of the language choice itself)."""
    return LanguageBrowser(_chromium, getattr(request.module, "UI_LANGUAGE", "fr"))
