"""Capture screen test support: open the runtime input with a seeded match."""
from __future__ import annotations

from helpers import APP_URI, base_match


def open_runtime(browser, mode="FOCUS", viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    match = base_match(())
    page.evaluate(
        """payload => {
          localStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
          localStorage.setItem('volleyCapture.events.v1', '[]');
          localStorage.setItem('volleyCapture.chartData.v1', '[]');
          localStorage.setItem('volleyCapture.settings.v1', JSON.stringify({
            setsToWin: 3, detailLevel: 'advanced'
          }));
          localStorage.setItem('volleyCapture.runtimeInput.preferences.v1', JSON.stringify({
            runtimeMode: payload.mode, runtimeHighlights: true, runtimeHaptics: false
          }));
          sessionStorage.setItem('volleyCapture.stage', 'capture');
        }""",
        {"match": match, "mode": mode},
    )
    page.reload()
    page.wait_for_timeout(160)
    return page, errors
