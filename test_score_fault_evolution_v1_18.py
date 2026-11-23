"""Score and Fault Evolution acceptance, integration, alignment, a11y and visual tests v1.18.0."""
from __future__ import annotations

import copy
import json
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

from test_spectator_timeline_v1_15 import V2_FIXTURE, archive_v2, open_spectator

ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = {
    "desktop_1536x1024": {"width": 1536, "height": 1024},
    "landscape_844x390": {"width": 844, "height": 390},
    "portrait_390x844": {"width": 390, "height": 844},
}


def evolution_fixture():
    # Every row is an official closed rally. ERROR belongs to the team that committed the fault.
    return archive_v2([
        (0, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),      # HOME SO
        (0, 2, "HOME", "HOME", "HOME", "BLOCK", "POINT"),       # HOME BP
        (1, 2, "AWAY", "HOME", "HOME", "SERVICE", "ERROR"),     # HOME fault, AWAY SO
        (2, 2, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),      # AWAY BP
        (2, 3, "HOME", "AWAY", "AWAY", "SERVICE", "ERROR"),     # AWAY fault, HOME SO
        (3, 3, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (3, 4, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (4, 4, "AWAY", "HOME", "AWAY", "ATTACK", "POINT"),
        (4, 5, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (5, 5, "AWAY", "HOME", "AWAY", "ATTACK", "POINT"),
        (5, 6, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
    ])


def two_set_fixture():
    data = evolution_fixture()
    data["match"]["currentSetNumber"] = 2
    data["sets"] = [
        {"setId": "s1", "setNumber": 1, "status": "COMPLETED", "initialServingTeamId": "away", "finalScore": {"our": 2, "opponent": 1}},
        {"setId": "s2", "setNumber": 2, "status": "IN_PROGRESS", "initialServingTeamId": "home", "finalScore": {"our": 1, "opponent": 1}},
    ]
    for idx, rally in enumerate(data["rallies"]):
        if idx < 3:
            continue
        rally["setId"] = "s2"
        rally["setNumber"] = 2
        rally["rallyNumber"] = idx - 2
        data["events"][idx]["setNumber"] = 2
    # Keep only two rallies in set 2 for a precise reset assertion.
    keep = {r["rallyId"] for r in data["rallies"][:5]}
    data["rallies"] = data["rallies"][:5]
    data["events"] = [e for e in data["events"] if e["rallyId"] in keep]
    return data


def open_graph(browser, data, viewport=None, window="all"):
    page, errors = open_spectator(browser, data, viewport)
    page.locator('[data-tab="live-graph"]').click()
    page.locator("#graphWindowSize").select_option(window)
    page.wait_for_timeout(100)
    return page, errors


def test_unit_deltas_classification_fault_cumulation_and_shared_rally_keys(browser):
    page, errors = open_graph(browser, evolution_fixture())
    items = page.evaluate("VolleySpectator.getModel().rallies")
    assert [x["scoreDelta"] for x in items[:5]] == [1, 2, 1, 0, 1]
    assert [x["pointClassification"] for x in items[:4]] == ["SIDE_OUT", "BREAK_POINT", "SIDE_OUT", "BREAK_POINT"]
    assert [(x["cumulativeHomeFaults"], x["cumulativeAwayFaults"], x["faultDelta"]) for x in items[:5]] == [
        (0, 0, 0), (0, 0, 0), (1, 0, 1), (1, 0, 1), (1, 1, 0)
    ]
    assert all(x["scoreDelta"] == x["homeScore"] - x["awayScore"] for x in items)
    assert all(x["faultDelta"] == x["cumulativeHomeFaults"] - x["cumulativeAwayFaults"] for x in items)
    keys = page.locator(".score-row.home .evolution-cell").evaluate_all("els => els.map(e => e.dataset.rallyKey)")
    assert keys == page.locator(".fault-row.away .evolution-cell").evaluate_all("els => els.map(e => e.dataset.rallyKey)")
    assert keys == page.locator(".score-delta-chart .delta-point").evaluate_all("els => els.map(e => e.dataset.rallyKey)")
    assert keys == page.locator(".fault-delta-chart .delta-point").evaluate_all("els => els.map(e => e.dataset.rallyKey)")
    assert page.locator(".score-cell.so").count() >= 1
    assert page.locator(".score-cell.bp-home").count() >= 1
    assert page.locator(".score-cell.bp-away").count() >= 1
    assert page.locator(".fault-cell.new-fault").count() == 2
    assert not errors
    page.close()


def test_multiple_faults_in_one_rally_follow_shared_official_rule(browser):
    data = evolution_fixture()
    extra = copy.deepcopy(data["events"][2])
    extra.update({"eventId": "e-extra-fault", "sequenceNumber": 100, "terminalEventId": None})
    data["events"].append(extra)
    page, errors = open_graph(browser, data)
    item = page.evaluate("VolleySpectator.getModel().rallies[2]")
    assert item["homeFaultIncrement"] == 2
    assert item["cumulativeHomeFaults"] == 2
    assert not errors
    page.close()


def test_set_selection_resets_score_and_faults_and_filters_atomically(browser):
    page, errors = open_graph(browser, two_set_fixture())
    assert page.locator("#evolutionSet").input_value() == "2"
    set2 = page.evaluate("VolleySpectator.getModel()")
    assert [r["rallyOrdinal"] for r in set2["rallies"]] == [1, 2]
    assert set2["rallies"][0]["cumulativeHomeFaults"] == 0
    page.locator("#evolutionSet").select_option("1")
    set1 = page.evaluate("VolleySpectator.getModel()")
    assert set1["currentSet"] == 1
    assert [r["rallyOrdinal"] for r in set1["rallies"]] == [1, 2, 3]
    assert set1["rallies"][-1]["homeScore"] == 2 and set1["rallies"][-1]["awayScore"] == 1
    assert set1["rallies"][-1]["cumulativeHomeFaults"] == 1
    assert page.locator(".score-row .evolution-cell").count() == 6
    assert page.locator(".fault-row .evolution-cell").count() == 6
    assert not errors
    page.close()


def test_undo_rebuilds_without_stale_points_and_missing_classification_is_neutral(browser):
    data = evolution_fixture()
    data["rallies"][0]["servingTeamId"] = "unknown-team"
    page, errors = open_graph(browser, data)
    assert page.evaluate("VolleySpectator.getModel().rallies[0].pointClassification") is None
    assert page.locator('.score-row.home .score-cell[data-rally-key="r1"]').get_attribute("class").endswith("neutral")
    trimmed = copy.deepcopy(data)
    trimmed["rallies"] = trimmed["rallies"][:-1]
    trimmed["events"] = trimmed["events"][:-1]
    page.evaluate("d => VolleySpectator.setArchive(d)", trimmed)
    assert page.locator(".score-delta-chart .delta-point").count() == len(trimmed["rallies"])
    assert page.locator(".fault-delta-chart .delta-point").count() == len(trimmed["rallies"])
    assert page.locator('[data-rally-key="r11"]').count() == 0
    assert not errors
    page.close()


def test_official_json_integration_scores_faults_all_sets_and_reopen_stability(browser):
    data = json.loads(V2_FIXTURE.read_text())
    page, errors = open_graph(browser, data)
    set_defs = {int(s["setNumber"]): s for s in data["sets"]}
    assert page.locator("#evolutionSet option").count() == len(set_defs)
    snapshots = {}
    for set_no, set_def in set_defs.items():
        page.locator("#evolutionSet").select_option(str(set_no))
        model = page.evaluate("VolleySpectator.getModel()")
        final = model["rallies"][-1]
        assert (final["homeScore"], final["awayScore"]) == (set_def["finalScore"]["our"], set_def["finalScore"]["opponent"])
        assert all(r["set"] == set_no for r in model["rallies"])
        assert all(r["scoreDelta"] == r["homeScore"] - r["awayScore"] for r in model["rallies"])
        assert all(r["faultDelta"] == r["cumulativeHomeFaults"] - r["cumulativeAwayFaults"] for r in model["rallies"])
        snapshots[set_no] = [(r["rallyKey"], r["scoreDelta"], r["faultDelta"]) for r in model["rallies"]]
    page.reload()
    page.locator('[data-tab="live-graph"]').click()
    reopened = page.evaluate("VolleySpectator.getModel()")
    assert snapshots[reopened["currentSet"]] == [(r["rallyKey"], r["scoreDelta"], r["faultDelta"]) for r in reopened["rallies"]]
    assert not errors
    page.close()


def test_exact_alignment_within_one_css_pixel_and_uniform_curve_colors(browser):
    page, errors = open_graph(browser, evolution_fixture(), VIEWPORTS["desktop_1536x1024"], "11")
    page.wait_for_timeout(100)
    alignment = page.evaluate(
        """() => {
          const centers = selector => [...document.querySelectorAll(selector)].map(e => {
            const r=e.getBoundingClientRect(); return r.left+r.width/2;
          });
          return {
            score: centers('.score-row.home .evolution-cell'),
            scorePoint: centers('.score-delta-chart .delta-point'),
            fault: centers('.fault-row.home .evolution-cell'),
            faultPoint: centers('.fault-delta-chart .delta-point')
          };
        }"""
    )
    for i in range(11):
        values = [alignment[k][i] for k in alignment]
        assert max(values) - min(values) <= 1, (i, values)
    score_colors = page.locator(".score-delta-chart .delta-point").evaluate_all("els => [...new Set(els.map(e => getComputedStyle(e).fill))]")
    fault_colors = page.locator(".fault-delta-chart .delta-point").evaluate_all("els => [...new Set(els.map(e => getComputedStyle(e).fill))]")
    assert len(score_colors) == len(fault_colors) == 1
    assert not errors
    page.close()


def test_empty_one_rally_accessibility_keyboard_touch_and_reduced_motion(browser):
    page, errors = open_graph(browser, archive_v2([]), VIEWPORTS["portrait_390x844"])
    assert page.locator("#graphEmpty").is_visible()
    assert page.locator(".delta-point").count() == 0
    page.close()

    one = archive_v2([(0, 1, "HOME", "AWAY", "AWAY", "SERVICE", "ERROR")])
    page, one_errors = open_graph(browser, one, VIEWPORTS["portrait_390x844"])
    assert page.locator(".score-delta-chart .delta-point").count() == 1
    assert page.locator(".score-delta-chart .delta-series").count() == 0
    assert "Set 1" in page.locator("#scoreSummary").inner_text()
    assert "fautes" in page.locator("#faultSummary").inner_text()
    for selector in ("#evolutionSet", "#graphWindowSize", '[data-graph-order="oldestFirst"]'):
        assert page.locator(selector).bounding_box()["height"] >= 44
    assert page.locator(".score-cell.so").get_attribute("aria-label") == "HOME 1, Side-out, rallye 1"
    ratios = page.locator(".score-cell.so, .fault-cell.new-fault").evaluate_all(
        """els => els.map(e => {
          const rgb=s=>s.match(/\\d+/g).slice(0,3).map(Number);
          const lum=s=>{const c=rgb(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
          const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        })"""
    )
    assert all(ratio >= 4.5 for ratio in ratios)
    page.locator("#evolutionSet").focus()
    assert page.evaluate("document.activeElement.id") == "evolutionSet"
    css = (ROOT / "spectator.css").read_text()
    assert "prefers-reduced-motion: reduce" in css
    assert not errors and not one_errors
    page.close()


def test_history_browse_return_live_and_live_replay_data_parity(browser):
    data = archive_v2([(i, 0, "AWAY", "AWAY") for i in range(1, 31)], status="IN_PROGRESS")
    page, errors = open_graph(browser, data, VIEWPORTS["portrait_390x844"], "all")
    scroll = page.locator("#graphContent")
    scroll.evaluate("e => { e.scrollLeft = 0; e.dispatchEvent(new Event('scroll')); }")
    page.wait_for_timeout(50)
    assert page.locator("#returnLive").is_visible()
    page.locator("#returnLive").click()
    page.wait_for_timeout(1000)
    position = scroll.evaluate("e => ({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth})")
    assert abs(position["left"] - position["max"]) <= 2
    assert page.locator("#returnLive").is_hidden()

    replay = copy.deepcopy(data)
    replay["match"]["lifecycleStatus"] = "COMPLETED"
    live_items, replay_items = page.evaluate(
        """([live,replay]) => [live,replay].map(d => VolleySpectator.buildViewModel(d).rallies.map(r =>
          [r.rallyKey,r.homeScore,r.awayScore,r.scoreDelta,r.cumulativeHomeFaults,r.cumulativeAwayFaults,r.faultDelta]))""",
        [data, replay],
    )
    assert live_items == replay_items
    assert not errors
    page.close()


def test_timeline_selector_performance_target(browser):
    data = json.loads(V2_FIXTURE.read_text())
    page, errors = open_graph(browser, data)
    average_ms = page.evaluate(
        """d => { const start=performance.now(); for(let i=0;i<100;i++) VolleySpectator.buildViewModel(d); return (performance.now()-start)/100; }""",
        data,
    )
    assert average_ms < 16, average_ms
    assert not errors
    page.close()


def test_visual_regression_score_fault_evolution_three_viewports(browser, tmp_path):
    data = evolution_fixture()
    for name, viewport in VIEWPORTS.items():
        page, errors = open_graph(browser, data, viewport, "11")
        page.wait_for_timeout(200)
        actual = tmp_path / f"score_fault_{name}.png"
        page.screenshot(path=str(actual), full_page=False)
        baseline = ROOT / "tests" / "visual_baselines" / f"score_fault_{name}_v1_19_0.png"
        assert baseline.exists(), f"Missing visual baseline {baseline.name}"
        observed = Image.open(actual).convert("RGB")
        expected = Image.open(baseline).convert("RGB")
        assert observed.size == expected.size == (viewport["width"], viewport["height"])
        diff = ImageChops.difference(expected, observed)
        assert max(ImageStat.Stat(diff).mean) < 3.5, (name, ImageStat.Stat(diff).mean)
        assert not errors
        page.close()
