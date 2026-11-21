"""Demo-only red-highlighting acceptance for Advanced Statistics and Coach View v1.12.3."""
from __future__ import annotations

import json

from helpers import APP_URI, ROOT

CAPTURE_V1 = ROOT / "tests/data/As_cannes_vs_Frejus_2026-11-15.capture.v1.json"


def _seed_reference_capture(page):
    raw = json.loads(CAPTURE_V1.read_text(encoding="utf-8"))
    page.evaluate(
        """raw => {
          localStorage.clear(); sessionStorage.clear();
          localStorage.setItem('volleyCapture.match.v1', JSON.stringify(raw.match));
          localStorage.setItem('volleyCapture.events.v1', JSON.stringify(raw.events));
          localStorage.setItem('volleyCapture.chartData.v1', JSON.stringify(raw.chartData || []));
        }""",
        raw,
    )
    page.reload()


def test_adapter_distinguishes_demo_fixture_from_real_and_historical_match_data():
    adapter = (ROOT / "statistics/adapter.js").read_text(encoding="utf-8")
    assert "reference-fixture-demo" in adapter
    assert "explicit-unified-v2-records" in adapter
    assert "capture-v1-inferred-context" in adapter
    assert "phase:false,rotation:false,lineup:false" in adapter
    assert "demo:fixture" in adapter


def test_reference_fixture_is_red_as_demo_in_coach_view(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    page.locator("#homeCoach").click()

    assert page.locator("#coachLiveLabel").inner_text() == "DÉMO · SANS VALEUR RÉELLE"
    assert page.locator("#coachContent .demo-only-indicator").count() >= 8
    assert page.locator("#coachContent [data-demo-only='true']").count() >= 8
    assert "Rouge = valeur de démonstration" in page.locator("#coachContent .coach-provenance").inner_text()
    assert "DÉMO" in page.locator("#coachContent").inner_text()
    page.close()


def test_capture_v1_historical_calculations_are_not_red_in_coach_view(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(APP_URI)
    _seed_reference_capture(page)
    page.locator("#homeCoach").click()

    assert page.locator("#coachLiveLabel").inner_text() == "V1 · HISTORIQUE CALCULÉ"
    assert page.locator("#coachContent .demo-only-indicator").count() == 0
    assert page.locator("#coachContent [data-demo-only='true']").count() == 0
    sideout = page.locator(".coach-kpi", has_text="Side-out")
    assert sideout.get_attribute("data-json-backed") == "false"
    assert sideout.get_attribute("data-demo-only") == "false"
    assert "DÉMO" not in sideout.inner_text()
    assert "SEUIL HORS JSON" not in page.locator("#coachContent").inner_text()
    page.close()


def test_reference_fixture_is_red_as_demo_in_advanced_statistics(browser):
    page = browser.new_page(viewport={"width": 820, "height": 900})
    page.goto(APP_URI.replace("index.html", "statistics/index.html"))
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    page.wait_for_selector("#statsLoader", state="hidden")

    assert "Référence v2.1" in page.locator("#dataStatusTitle").inner_text()
    assert page.locator("html.stats-demo-only").count() == 1
    assert page.locator("#view .demo-only-indicator").count() > 0
    assert "Rouge = valeur de démonstration" in page.locator("#jsonProvenanceNotice").inner_text()
    page.close()


def test_capture_v1_historical_calculations_and_thresholds_are_not_demo_red_in_advanced_statistics(browser):
    page = browser.new_page(viewport={"width": 820, "height": 900})
    page.goto(APP_URI)
    _seed_reference_capture(page)
    page.goto(APP_URI.replace("index.html", "statistics/index.html"))
    page.wait_for_selector("#statsLoader", state="hidden")

    assert "capture v1" in page.locator("#dataStatusSummary").inner_text().lower()
    assert page.locator("html.stats-demo-only").count() == 0
    assert page.locator("#view .demo-only-indicator").count() == 0
    assert "calculées depuis son historique" in page.locator("#jsonProvenanceNotice").inner_text()

    page.locator("#rotationMetricsBtn").click()
    assert "demo-only-indicator" not in (page.locator("#rmSideout").get_attribute("class") or "")
    assert page.locator("#rotationMetricsBody .demo-only-indicator").count() == 0
    assert page.locator("#rotationMetricsBody .json-threshold-indicator").count() == 0
    page.close()
