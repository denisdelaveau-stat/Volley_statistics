"""v1.15.0 spectator LIVE TIMELINE specification T1–T11 and archive flow."""
from __future__ import annotations

import copy
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageStat

from helpers import APP_URI

ROOT = Path(__file__).resolve().parents[1]
SPECTATOR_URI = (ROOT / "spectator.html").as_uri()
V2_FIXTURE = ROOT / "statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json"


def archive_v2(rows, *, basic=False, status="IN_PROGRESS"):
    rallies, events = [], []
    for i, row in enumerate(rows, 1):
        away, home, winner, serving = row[:4]
        action_side = row[4] if len(row) > 4 else winner
        skill = row[5] if len(row) > 5 else "ATTACK"
        result = row[6] if len(row) > 6 else ("POINT" if action_side == winner else "ERROR")
        rally_id, event_id = f"r{i}", f"e{i}"
        rallies.append(
            {
                "rallyId": rally_id,
                "setId": "s1",
                "setNumber": 1,
                "rallyNumber": i,
                "status": "CLOSED",
                "servingTeamId": "home" if serving == "HOME" else "away",
                "receivingTeamId": "away" if serving == "HOME" else "home",
                "phaseAtStart": "SERVE" if serving == "HOME" else "RECEPTION",
                "scoreBefore": {"our": max(0, home - (winner == "HOME")), "opponent": max(0, away - (winner == "AWAY"))},
                "scoreAfter": {"our": home, "opponent": away},
                "winnerTeamId": "home" if winner == "HOME" else "away",
                "terminalEventId": event_id,
            }
        )
        events.append(
            {
                "eventId": event_id,
                "eventType": "ACTION",
                "rallyId": rally_id,
                "setNumber": 1,
                "sequenceNumber": i,
                "actionOrder": 1,
                "teamId": "home" if action_side == "HOME" else "away",
                "playerId": "p12" if action_side == "HOME" else None,
                "actionType": "GENERIC" if basic else skill,
                "evaluation": result,
                "winnerTeamId": "home" if winner == "HOME" else "away",
                "scoreAfter": {"our": home, "opponent": away},
                "status": "ACTIVE",
            }
        )
    return {
        "format": "volley-live",
        "schemaVersion": "2.1.0",
        "documentType": "match",
        "match": {"matchId": "m1", "name": "AWAY vs HOME", "ourTeamId": "home", "opponentTeamId": "away", "currentSetNumber": 1, "lifecycleStatus": status, "detailLevel": "basic" if basic else "advanced"},
        "teams": [{"teamId": "home", "side": "OUR", "name": "HOME"}, {"teamId": "away", "side": "OPPONENT", "name": "AWAY"}],
        "players": [{"playerId": "p12", "teamId": "home", "number": 12, "name": "Sam Delaveau au nom très long", "role": "OH"}],
        "sets": [{"setId": "s1", "setNumber": 1, "status": "IN_PROGRESS", "initialServingTeamId": "away", "finalScore": {"our": 0, "opponent": 0}}],
        "lineups": [],
        "rallies": rallies,
        "events": events,
    }


def archive_v1(*, basic=False):
    match = {
        "id": "v1",
        "name": "Capture v1",
        "status": "finished",
        "detailLevel": "basic" if basic else "advanced",
        "team": {"name": "HOME", "roster": [{"number": 12, "name": "Sam", "position": "oh"}]},
        "opponent": {"name": "AWAY"},
        "currentSet": 1,
        "firstRally": {"antibesState": "reception"},
    }
    events = [
        {"id": 1, "set": 1, "player": "T" if basic else 12, "action": "generic" if basic else "attack", "result": "point", "winningTeam": "team1", "scoreA": 1, "scoreB": 0},
        {"id": 2, "set": 1, "player": "A", "action": "adverse", "result": "point", "winningTeam": "team2", "scoreA": 1, "scoreB": 1},
    ]
    return {"format": "volley-live-capture", "version": 1, "match": match, "events": events, "chartData": []}


def open_spectator(browser, archive, viewport=None):
    page = browser.new_page(viewport=viewport or {"width": 1536, "height": 1024})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(SPECTATOR_URI)
    page.evaluate("localStorage.clear()")
    page.evaluate("d => localStorage.setItem('volleySpectator.archive.v1', JSON.stringify(d))", archive)
    page.reload()
    page.wait_for_timeout(100)
    return page, errors


def test_match_library_import_opens_valid_v21_in_selected_spectator_view(browser):
    page = browser.new_page(viewport={"width": 1024, "height": 768})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    page.locator("#homeInsights").click(); page.locator("#insightsMatchLibrary").click()
    page.locator("#matchLibraryFile").set_input_files(str(V2_FIXTURE))
    page.wait_for_function("document.querySelector('#libraryFinishedCount').textContent.trim() === '1'")
    assert page.locator("#libraryFinishedCount").inner_text() == "1"
    assert page.locator(".library-row.selected").count() == 1
    page.locator("#libraryOpenSpectator").click()
    page.wait_for_url("**/spectator.html#live-score")
    page.locator('[data-tab="live-timeline"]').click()
    assert page.locator('[data-tab="live-timeline"]').get_attribute("aria-selected") == "true"
    assert page.locator(".tl-row").count() == 5
    assert page.locator(".replay-status").inner_text().strip() == "REPLAY D’ARCHIVE"
    assert "Suivi en direct" not in page.locator("body").inner_text()
    assert not errors
    page.close()


def test_t1_t2_t3_t4_delta_lanes_and_common_scale(browser):
    data = archive_v2([(14, 8, "AWAY", "AWAY"), (10, 13, "HOME", "HOME"), (11, 11, "HOME", "AWAY"), (13, 12, "AWAY", "HOME")])
    page, errors = open_spectator(browser, data)
    rows = page.locator(".tl-row")
    assert rows.nth(0).locator(".delta-lane.away .delta-bar").inner_text() == "+6"  # T1
    assert rows.nth(0).locator(".delta-lane.home .delta-bar").count() == 0
    assert rows.nth(1).locator(".delta-lane.home .delta-bar").inner_text() == "+3"  # T2
    assert rows.nth(1).locator(".delta-lane.away .delta-bar").count() == 0
    assert rows.nth(2).locator(".delta-bar").count() == 0  # T3
    assert rows.nth(0).locator(".delta-bar").get_attribute("style") is None
    assert rows.nth(1).locator(".delta-bar").get_attribute("style") is None
    widths = [rows.nth(i).locator(".delta-bar").bounding_box()["width"] for i in (0, 1)]
    assert max(widths) - min(widths) < 1
    assert all(abs(width - 38) < 1 for width in widths)
    lanes = ["away" if rows.nth(i).locator(".delta-lane.away .delta-bar").count() else "home" if rows.nth(i).locator(".delta-lane.home .delta-bar").count() else "tie" for i in range(4)]
    assert lanes == ["away", "home", "tie", "away"]  # T4
    assert not errors
    page.close()


def test_t5_window_with_only_three_rallies_has_three_rows(browser):
    page, errors = open_spectator(browser, archive_v2([(1, 0, "AWAY", "AWAY"), (1, 1, "HOME", "AWAY"), (2, 1, "AWAY", "HOME")]))
    assert page.locator("#windowSize").input_value() == "5"
    assert page.locator(".tl-row").count() == 3
    assert not errors
    page.close()


def test_t6_t7_t8_side_out_and_break_point_are_derived_without_badges(browser):
    data = archive_v2([(0, 1, "HOME", "AWAY"), (0, 2, "HOME", "HOME"), (1, 2, "AWAY", "AWAY")])
    page, errors = open_spectator(browser, data)
    assert page.locator(".tl-row").evaluate_all("rows => rows.map(r => r.dataset.code)") == ["SO", "BP", "BP"]
    assert page.locator(".chip").count() == 0
    assert not errors
    page.close()


def test_t9_service_fault_by_non_serving_team_is_flagged(browser):
    data = archive_v2([(0, 1, "HOME", "HOME", "AWAY", "SERVICE", "ERROR")])
    page, errors = open_spectator(browser, data)
    assert page.locator('.tl-row[data-valid="false"]').count() == 1
    assert "rejetée" in page.locator("#timelineWarning").inner_text()
    assert not errors
    page.close()


def test_t10_newest_first_and_filter_persistence(browser):
    data = archive_v2([(1, 0, "AWAY", "AWAY"), (1, 1, "HOME", "AWAY"), (2, 1, "AWAY", "HOME")])
    page, errors = open_spectator(browser, data)
    page.locator('[data-order="newestFirst"]').click()
    page.locator("#windowSize").select_option("10")
    assert page.locator(".tl-row").first.get_attribute("data-rally") == "3"
    assert page.locator(".tl-row").first.locator(".last-point").count() == 1
    page.reload()
    assert page.locator('[data-order="newestFirst"]').get_attribute("aria-pressed") == "true"
    assert page.locator("#windowSize").input_value() == "10"
    assert not errors
    page.close()


def test_t11_archive_correction_recomposes_last_point(browser):
    data = archive_v2([(1, 0, "AWAY", "AWAY"), (1, 1, "HOME", "AWAY"), (2, 1, "AWAY", "HOME")])
    page, errors = open_spectator(browser, data)
    trimmed = copy.deepcopy(data)
    trimmed["rallies"] = trimmed["rallies"][:-1]
    trimmed["events"] = trimmed["events"][:-1]
    page.evaluate("d => window.VolleySpectator.setArchive(d)", trimmed)
    assert page.locator(".tl-row").count() == 2
    assert page.locator(".tl-row").last.get_attribute("data-rally") == "2"
    assert page.locator(".tl-row").last.locator(".last-point").count() == 1
    assert page.locator("#headerAway").inner_text() == "1" and page.locator("#headerHome").inner_text() == "1"
    assert not errors
    page.close()


def test_capture_v1_and_basic_score_only_are_supported_without_invention(browser):
    page, errors = open_spectator(browser, archive_v2([(1, 0, "AWAY", "AWAY"), (1, 1, "HOME", "AWAY")], basic=True))
    assert page.locator(".tl-row").count() == 2
    assert page.locator(".event-card").count() == 0
    assert page.locator(".score-pill").count() == 2
    assert not errors
    page.close()

    page, errors = open_spectator(browser, archive_v1())
    assert page.locator(".tl-row").count() == 2
    assert page.locator(".event-card.home").count() == 1
    assert page.locator(".away-marker").count() == 1
    assert page.locator("#archiveBadge").inner_text() == "TERMINÉ"
    assert not errors
    page.close()

    page, errors = open_spectator(browser, archive_v1(basic=True))
    assert page.locator(".tl-row").count() == 2
    assert page.locator(".event-card").count() == 0
    assert page.locator(".score-pill").count() == 2
    assert not errors
    page.close()


def test_return_home_invalid_archive_tablet_and_accessibility(browser):
    data = archive_v2([(14, 8, "AWAY", "AWAY"), (14, 9, "HOME", "AWAY")])
    page, errors = open_spectator(browser, data, viewport={"width": 1024, "height": 768})
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator(".spectator-home").bounding_box()["height"] >= 44
    for selector in ("[data-order=oldestFirst]", "[data-order=newestFirst]", "#windowSize"):
        assert page.locator(selector).bounding_box()["height"] >= 44
    name = page.locator(".event-name").last
    assert name.get_attribute("title") is None  # title lives on the card
    assert page.locator(".event-card.home").get_attribute("title") == "Sam Delaveau au nom très long"
    page.locator(".spectator-home").click()
    page.wait_for_url("**/index.html")
    assert page.locator("#homeScreen").is_visible()
    assert not errors
    page.close()

    invalid = browser.new_page()
    invalid.goto(SPECTATOR_URI)
    invalid.evaluate("localStorage.clear(); localStorage.setItem('volleySpectator.archive.v1','{}')")
    invalid.reload()
    assert invalid.locator("#fatal").is_visible()
    assert "Format non reconnu" in invalid.locator("#fatalText").inner_text()
    invalid.close()


def test_spectator_visual_geometry_1536x1024_and_contrast(browser, tmp_path):
    page, errors = open_spectator(browser, json.loads(V2_FIXTURE.read_text()), viewport={"width": 1536, "height": 1024})
    page.wait_for_timeout(300)  # settle the 200 ms row-entry animation before pixel comparison
    actual = tmp_path / "spectator.png"
    page.screenshot(path=str(actual), full_page=False)
    observed = Image.open(actual).convert("RGB")
    assert observed.size == (1536, 1024)
    geometry = page.evaluate(
        r"""() => {
          const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
          return {
            viewport: {width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth},
            header: rect('.spectator-header'), nav: rect('.spectator-nav'),
            filters: rect('.timeline-filterbar'), board: rect('.timeline-board'),
            title: rect('.timeline-title'), columns: rect('.timeline-columns'),
            list: rect('.timeline-list'), rows: document.querySelectorAll('.event-card').length,
            navTargets: [...document.querySelectorAll('.spectator-nav a,.spectator-nav button')].map(e=>e.getBoundingClientRect().height)
          };
        }"""
    )
    view = geometry["viewport"]
    assert view["scrollWidth"] <= view["width"]
    assert geometry["header"]["bottom"] <= geometry["nav"]["y"]
    assert geometry["nav"]["bottom"] <= geometry["filters"]["y"]
    assert geometry["filters"]["bottom"] <= geometry["board"]["y"]
    assert geometry["board"]["x"] >= 0 and geometry["board"]["right"] <= view["width"]
    # The decorative column guide may use display:contents and report a zero rect;
    # the meaningful invariant is that event content starts below the title.
    assert geometry["title"]["bottom"] <= geometry["list"]["y"]
    assert geometry["rows"] > 0
    assert min(geometry["navTargets"]) >= 44
    ratios = page.evaluate(
        r"""() => {
          const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
          const lum=c=>{c=rgb(c).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
          const ratio=(a,b)=>{a=lum(a);b=lum(b);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
          return ['.spectator-nav button[aria-selected=true]','.event-name','.home-action.point','.home-action.error','.replay-status'].map(sel=>{const e=document.querySelector(sel); if(!e) return [sel, 4.5]; const s=getComputedStyle(e);return [sel,ratio(s.color,s.backgroundColor)]});
        }"""
    )
    assert all(value >= 4.5 for _, value in ratios)
    assert not errors
    page.close()
