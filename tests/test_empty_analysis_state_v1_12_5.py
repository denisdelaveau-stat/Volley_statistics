"""Empty -> loaded -> unloaded acceptance for Coach View and Advanced Statistics v1.12.5."""
from __future__ import annotations

import re
from helpers import APP_URI, ROOT

FIXTURE = ROOT / "statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json"

def _clear(page):
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()

def _only_zero_or_na(values):
    return all(re.fullmatch(r"(?:0|NA)", value.strip()) for value in values if value.strip())

def test_coach_empty_file_replay_and_unload(browser):
    page=browser.new_page(viewport={"width":390,"height":844}); page.goto(APP_URI); _clear(page); page.locator("#homeCoach").click()
    assert page.locator("#coachLiveLabel").inner_text()=="AUCUN MATCH"
    assert "Aucun match chargé" in page.locator("#coachContent").inner_text()
    assert "Cannes" not in page.locator("#coachContent").inner_text()
    assert page.locator("#coachContent .empty-indicator").count()>10
    values=page.locator("#coachContent .empty-indicator .value, #coachContent .empty-indicator.value").all_inner_texts(); assert _only_zero_or_na(values)
    assert page.locator("#coachContent .demo-only-indicator, #coachContent .json-audit-badge").count()==0
    assert "NaN" not in page.locator("#coachContent").inner_text() and "Infinity" not in page.locator("#coachContent").inner_text()
    color=page.locator("#coachContent .empty-indicator").first.evaluate("e=>getComputedStyle(e).color"); assert color == "rgb(184, 192, 201)"
    page.locator("[data-coach-tab=rotations]").click(); assert "Aucun match actif" in page.locator("#coachContent").inner_text(); assert "NA" in page.locator("#coachContent").inner_text()
    page.locator("[data-coach-tab=players]").click(); assert "0 joueur" in page.locator("#coachContent").inner_text().lower()
    page.set_viewport_size({"width":844,"height":390}); page.locator("[data-empty-detail]").click(); assert page.locator(".player-focus-view").is_visible(); assert "NA" in page.locator("#coachContent").inner_text()
    page.set_input_files("#coachFileInput", str(FIXTURE)); page.wait_for_timeout(300)
    assert page.locator("#coachLiveLabel").inner_text()=="REPLAY · MATCH"
    assert "Aucun match chargé" not in page.locator("#coachContent").inner_text()
    assert page.locator("#coachContent .coach-kpi .value").first.inner_text() not in ("0","NA")
    page.locator("[data-coach-unload]").click(); assert page.locator("#coachLiveLabel").inner_text()=="AUCUN MATCH"
    assert "Aucun match chargé" in page.locator("#coachContent").inner_text(); assert "Replay JSON chargé" not in page.locator("#coachContent").inner_text()
    page.close()

def test_advanced_statistics_empty_file_replay_and_unload(browser):
    page=browser.new_page(viewport={"width":820,"height":900}); page.goto(APP_URI.replace("index.html","statistics/index.html")); _clear(page); page.wait_for_selector("#statsLoader",state="hidden")
    assert "Aucun match chargé" in page.locator("#statsMatchTitle").inner_text()
    assert "Cannes" not in page.locator("body").inner_text()
    assert page.locator("html.stats-empty-state").count()==1
    assert page.locator(".demo-only-indicator, .json-audit-badge, html.stats-demo-only").count()==0
    assert "NaN" not in page.locator("body").inner_text() and "Infinity" not in page.locator("body").inner_text()
    color=page.locator(".empty-indicator").first.evaluate("e=>getComputedStyle(e).color"); assert color == "rgb(122, 131, 141)"
    assert page.locator("#mc").inner_text()=="0" and page.locator("#mr").inner_text()=="0"
    assert page.locator("#playerStats").inner_text().count("NA")>=3
    page.locator("#rotationMetricsBtn").click(); assert page.locator("#rmActions").inner_text()=="0"; assert page.locator("#rmAttackEff").inner_text()=="NA"; assert page.locator("#rmSideout").inner_text()=="NA"
    page.locator("#backTimelineBtn").click(); page.locator("#rosterRankingBtn").click(); assert "0 joueur" in page.locator("#rosterRankingCards").inner_text().lower()
    page.locator("#backRosterBtn").click(); page.locator("#playingTimeBtn").click(); assert page.locator("#playingSetRallies").inner_text()=="0"; assert "NA" in page.locator("#ralliesPlayedList").inner_text()
    page.locator("#backPlayingBtn").click(); page.set_input_files("#statsFileInput",str(FIXTURE)); page.wait_for_selector("#statsLoader",state="hidden")
    assert "cannes" in page.locator("#statsMatchTitle").inner_text().lower(); assert page.locator("html.stats-empty-state").count()==0; assert int(page.locator("#mc").inner_text())>0
    page.locator("#statsUnloadBtn").click(); page.wait_for_selector("#statsLoader",state="hidden")
    assert "Aucun match chargé" in page.locator("#statsMatchTitle").inner_text(); assert "Cannes" not in page.locator("body").inner_text(); assert page.locator("#mc").inner_text()=="0"
    page.close()

def test_no_automatic_reference_fixture_loading():
    home=(ROOT/"index.html").read_text(encoding="utf-8"); stats=(ROOT/"statistics/index.html").read_text(encoding="utf-8")
    assert "reference-fixture.js" not in home and "reference-fixture.js" not in stats
    assert "fetch('data/As_cannes_vs_Frejus" not in stats
    assert "window.VolleyReferenceFixture" not in (ROOT/"coach.js").read_text(encoding="utf-8")


def test_coach_court_is_compact_without_legend_at_phone_and_tablet(browser):
    from helpers import base_match
    match = base_match("advanced", focus_off=())
    match["currentSet"] = 1
    event = {"id": 1, "set": 1, "player": 3, "action": "attack", "result": "point", "winningTeam": "team1", "scoreA": 1, "scoreB": 0}
    for width, height in ((390, 844), (1024, 900)):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(APP_URI)
        page.evaluate(
            """payload => {
              localStorage.clear(); sessionStorage.clear();
              localStorage.setItem('volleyCapture.match.v1', JSON.stringify(payload.match));
              localStorage.setItem('volleyCapture.events.v1', JSON.stringify(payload.events));
              localStorage.setItem('volleyCapture.chartData.v1', '[]');
            }""",
            {"match": match, "events": [event]},
        )
        page.reload(); page.locator("#homeCoach").click()
        assert page.locator(".coach-court-legend").count() == 0
        assert "P : Passeuse" not in page.locator(".coach-court-card").inner_text()
        assert page.locator(".coach-court-card .coach-chip").inner_text().startswith("Passeuse en P")
        assert page.locator(".coach-court .coach-net").count() == 1
        assert page.locator(".coach-court .coach-player-dot").count() == 6
        geometry = page.locator(".coach-court").evaluate(
            """court => {
              const c=court.getBoundingClientRect();
              const dots=[...court.querySelectorAll('.coach-player-dot')].map(x=>x.getBoundingClientRect());
              const maxBottom=Math.max(...dots.map(x=>x.bottom));
              const grid=getComputedStyle(court.querySelector('.coach-court-grid'),'::after');
              return {gap:Math.round(c.bottom-maxBottom), width:c.width, scroll:court.scrollWidth,
                      viewport:document.documentElement.clientWidth, dashed:grid.borderTopStyle};
            }"""
        )
        assert 4 <= geometry["gap"] <= 18
        assert geometry["scroll"] <= geometry["width"] + 1
        assert geometry["width"] <= geometry["viewport"]
        assert geometry["dashed"] == "dashed"
        page.close()
