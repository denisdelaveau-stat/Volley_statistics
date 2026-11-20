"""JSON provenance acceptance for Advanced Statistics and Coach View v1.12.2."""
from __future__ import annotations

import json
from pathlib import Path

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


def test_adapter_declares_explicit_and_inferred_provenance():
    adapter = (ROOT / "statistics/adapter.js").read_text(encoding="utf-8")
    assert "explicit-unified-v2-records" in adapter
    assert "capture-v1-inferred-context" in adapter
    assert "phase:false,rotation:false,lineup:false" in adapter
    assert "phase:true, rotation:true, lineup:true" in adapter


def test_coach_v2_values_are_record_backed_and_thresholds_are_red(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    page.locator("#homeCoach").click()

    assert page.locator("#coachLiveLabel").inner_text() == "V2.1 RÉF"
    assert page.locator("#coachContent .json-unbacked-indicator").count() == 0
    assert page.locator("#coachContent [data-json-backed='true']").count() >= 8
    assert page.locator("#coachContent .json-threshold-indicator").count() >= 3
    assert "SEUIL HORS JSON" in page.locator("#coachContent").inner_text()
    page.close()


def test_capture_v1_inferred_coach_indicators_are_red(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    page.goto(APP_URI)
    _seed_reference_capture(page)
    page.locator("#homeCoach").click()

    assert page.locator("#coachLiveLabel").inner_text() == "V1 · CONTEXTE DÉDUIT"
    assert page.locator(".coach-phase[data-json-backed='false']").count() == 1
    assert page.locator(".coach-court-card[data-json-backed='false']").count() == 1
    sideout = page.locator(".coach-kpi", has_text="Side-out")
    attack = page.locator(".coach-kpi", has_text="Efficacité attaque")
    assert sideout.get_attribute("data-json-backed") == "false"
    assert "json-unbacked-indicator" in sideout.get_attribute("class")
    assert attack.get_attribute("data-json-backed") == "true"
    assert "rgb(255, 107, 107)" in sideout.locator(".value").evaluate("e => getComputedStyle(e).color")
    page.close()


def test_capture_v1_inferred_advanced_indicators_are_red(browser):
    page = browser.new_page(viewport={"width": 820, "height": 900})
    page.goto(APP_URI)
    _seed_reference_capture(page)
    page.goto(APP_URI.replace("index.html", "statistics/index.html"))
    page.wait_for_selector("#statsLoader", state="hidden")

    assert "capture v1" in page.locator("#dataStatusSummary").inner_text().lower()
    assert page.locator("#view .rotation.json-unbacked-indicator").count() > 0
    assert page.locator("#view .phase.json-unbacked-indicator").count() > 0
    assert page.locator("#view .action-cell.json-unbacked-indicator").count() > 0
    assert "Rouge = indicateur" in page.locator("#jsonProvenanceNotice").inner_text()

    page.locator("#rotationMetricsBtn").click()
    assert "json-unbacked-indicator" in (page.locator("#rmSideout").get_attribute("class") or "")
    assert page.locator("#rotationMetricsBody .json-threshold-indicator").count() > 0
    page.close()
