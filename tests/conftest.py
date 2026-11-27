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

    The language is written to localStorage before the app scripts run, on every navigation, unless the page
    already stored a choice (so a test can still switch the language from Settings)."""

    def __init__(self, browser, language):
        self._browser = browser
        self._language = language

    def new_page(self, *args, **kwargs):
        page = self._browser.new_page(*args, **kwargs)
        if self._language:
            page.add_init_script(
                f"try {{ if (!localStorage.getItem('{LANGUAGE_KEY}')) "
                f"localStorage.setItem('{LANGUAGE_KEY}', JSON.stringify('{self._language}')); }} catch (e) {{}}"
            )
        return page

    def __getattr__(self, name):
        return getattr(self._browser, name)


@pytest.fixture
def browser(_chromium, request):
    """Each test module may set UI_LANGUAGE = "en" or "fr" (French, the app default, when omitted).
    UI_LANGUAGE = None leaves the language untouched (tests of the language choice itself)."""
    return LanguageBrowser(_chromium, getattr(request.module, "UI_LANGUAGE", "fr"))
