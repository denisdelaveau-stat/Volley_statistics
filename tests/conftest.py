from pathlib import Path
import sys
import pytest
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
from helpers import CHROMIUM


@pytest.fixture(scope="session")
def browser():
    with sync_playwright() as playwright:
        executable_path = CHROMIUM if CHROMIUM and Path(CHROMIUM).exists() else None
        instance = playwright.chromium.launch(executable_path=executable_path, headless=True)
        yield instance
        instance.close()
