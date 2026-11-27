"""v1.19.1 LIVE SCORE placement, Momentum T1-T12 and responsive/a11y checks."""
from __future__ import annotations

import copy
from pathlib import Path

import pytest
from PIL import Image, ImageChops, ImageStat

from spectator_support import SPECTATOR_URI, archive_v2, open_spectator

ROOT = Path(__file__).resolve().parents[2]


def points(sequence: str, set_number: int = 1):
    return [
        {"set": set_number, "rally": i, "rallyOrdinal": i, "winner": "HOME" if token == "H" else "AWAY"}
        for i, token in enumerate(sequence.replace(" ", ""), 1)
    ]


def evaluate_momentum(page, sequence: str, *, set_number=1):
    return page.evaluate(
        "([p,s]) => VolleySpectator.computeMomentum(p,s)",
        [points(sequence, set_number), set_number],
    )


def fixture_for_sequence(sequence: str, *, status="IN_PROGRESS"):
    home = away = 0
    rows = []
    for token in sequence.replace(" ", ""):
        winner = "HOME" if token == "H" else "AWAY"
        if winner == "HOME":
            home += 1
        else:
            away += 1
        rows.append((away, home, winner, winner))
    data = archive_v2(rows, status=status)
    data["match"]["name"] = "Fréjus vs AS Cannes"
    data["teams"][0]["name"] = "Fréjus"
    data["teams"][1]["name"] = "AS Cannes"
    return data


def select_live_score(page):
    page.locator('[data-tab="live-score"]').click()
    assert page.locator('[data-tab="live-score"]').get_attribute("aria-selected") == "true"
    assert page.locator('[data-panel="live-score"]').is_visible()
    assert page.locator('[data-panel="live-timeline"]').is_hidden()


def assert_live_score_structure(page):
    score_panel = page.locator('[data-panel="live-score"]')
    timeline_panel = page.locator('[data-panel="live-timeline"]')
    assert score_panel.locator("#liveScoreboard").count() == 1
    assert score_panel.locator("#momentumCard").count() == 1
    assert score_panel.locator(".summary-card").count() == 0
    assert timeline_panel.locator("#liveScoreboard, #momentumCard, .live-overview").count() == 0
    assert page.locator("#liveScoreboard").count() == 1
    assert page.locator("#momentumCard").count() == 1
    assert score_panel.locator(".team-crest").count() == 2
    assert page.evaluate(
        "document.querySelector('#liveScoreboard').compareDocumentPosition(document.querySelector('#momentumCard')) & Node.DOCUMENT_POSITION_FOLLOWING"
    )


@pytest.mark.parametrize(
    "case,sequence,counts,pct,leader,streak",
    [
        ("T1", "HAHHAHHH", (6, 2), (75, 25), "HOME", ("HOME", 3)),
        ("T2", "HAHAHAHAHAHAAAAAAHAA", (1, 7), (13, 87), "AWAY", ("AWAY", 2)),
        ("T3", "HAHAHAHA", (4, 4), (50, 50), "BALANCED", ("AWAY", 1)),
        ("T4", "HHAHAHAA", (4, 4), (50, 50), "BALANCED", ("AWAY", 2)),
        ("T5", "HHHAAHHA", (5, 3), (63, 37), "BALANCED", ("AWAY", 1)),
    ],
)
def test_t1_to_t5_window_percent_threshold_and_streak(browser, case, sequence, counts, pct, leader, streak):
    page, errors = open_spectator(browser, fixture_for_sequence("HAHH"))
    select_live_score(page)
    assert_live_score_structure(page)
    value = evaluate_momentum(page, sequence)
    assert (value["homeCount"], value["awayCount"]) == counts, case
    assert (value["homePct"], value["awayPct"]) == pct, case
    assert value["homePct"] + value["awayPct"] == 100
    assert value["leader"] == leader, case
    assert (value["streak"]["side"], value["streak"]["length"]) == streak, case
    assert value["sequence"] == [("HOME" if c == "H" else "AWAY") for c in sequence[-8:]]
    assert not errors
    page.close()


def test_t6_not_enough_data_real_counts_tiles_placeholders_and_streak(browser):
    page, errors = open_spectator(browser, fixture_for_sequence("HHA"), {"width": 390, "height": 844})
    select_live_score(page)
    assert_live_score_structure(page)
    vm = page.evaluate("VolleySpectator.momentumView(VolleySpectator.getModel())")
    assert vm["state"] == "NOT_ENOUGH"
    assert (vm["homeCount"], vm["awayCount"]) == (2, 1)
    assert vm["homePct"] is None and vm["awayPct"] is None
    assert page.locator(".momentum-tile.placeholder").count() == 5
    assert page.locator(".momentum-tile:not(.placeholder)").count() == 3
    assert page.locator("#streakText").inner_text() == "Dernier point · AS Cannes"
    assert page.locator("#homePct").inner_text() == "NA"
    assert not errors
    page.close()


def test_t7_new_set_zero_points(browser):
    page, errors = open_spectator(browser, fixture_for_sequence(""))
    select_live_score(page)
    assert_live_score_structure(page)
    vm = page.evaluate("VolleySpectator.momentumView(VolleySpectator.getModel())")
    assert vm["state"] == "NEW_SET"
    assert page.locator(".momentum-tile.placeholder").count() == 8
    assert page.locator("#streakText").inner_text() == "—"
    assert page.locator("#headerSet").inner_text() == "SET 1 · À VENIR"
    assert not errors
    page.close()


def test_t8_undo_recomputes_everything_from_json(browser):
    original = fixture_for_sequence("HAHHAHHH")
    page, errors = open_spectator(browser, original)
    select_live_score(page)
    assert_live_score_structure(page)
    assert page.locator("#homePct").inner_text() == "75 %"
    trimmed = copy.deepcopy(original)
    trimmed["rallies"] = trimmed["rallies"][:-1]
    trimmed["events"] = trimmed["events"][:-1]
    page.evaluate("d => VolleySpectator.setArchive(d)", trimmed)
    vm = page.evaluate("VolleySpectator.momentumView(VolleySpectator.getModel())")
    assert (vm["homeCount"], vm["awayCount"], vm["homePct"], vm["awayPct"], vm["leader"]) == (5, 2, 71, 29, "HOME")
    assert vm["streak"] == {"side": "HOME", "length": 2}
    assert page.locator(".momentum-tile.placeholder").count() == 1
    assert page.locator("#headerHome").inner_text() == "5"
    assert not errors
    page.close()


def test_t9_set_finished_keeps_final_score_momentum_and_final_streak(browser):
    data = fixture_for_sequence("HAHHAHHH")
    data["sets"][0].update({"status": "COMPLETED", "finalScore": {"our": 25, "opponent": 21}})
    data["rallies"][-1]["scoreAfter"] = {"our": 25, "opponent": 21}
    data["events"][-1]["scoreAfter"] = {"our": 25, "opponent": 21}
    page, errors = open_spectator(browser, data)
    select_live_score(page)
    assert_live_score_structure(page)
    assert page.locator("#headerHome").inner_text() == "25"
    assert page.locator("#headerAway").inner_text() == "21"
    assert page.locator("#setsHome").inner_text() == "1"
    assert page.locator("#headerSet").inner_text() == "FIN DU SET 1"
    assert page.locator("#momentumSubtitle").inner_text() == "Fin du set 1 · 8 derniers points"
    assert page.locator("#streakPill").inner_text() == "SÉRIE FINALE"
    assert page.locator("#homePct").inner_text() == "75 %"
    assert not errors
    page.close()


def test_t10_no_json_full_gray_empty_state_without_fatal(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(SPECTATOR_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()
    select_live_score(page)
    assert_live_score_structure(page)
    assert page.locator("#fatal").is_hidden()
    assert page.locator("#headerSet").inner_text() == "AUCUN MATCH"
    assert page.locator("#headerHome").inner_text() == "0" and page.locator("#headerAway").inner_text() == "0"
    assert page.locator("#homePct").inner_text() == "NA" and page.locator("#awayPct").inner_text() == "NA"
    assert page.locator(".momentum-tile.placeholder").count() == 8
    assert "state-no-match" in page.locator("#momentumCard").get_attribute("class")
    assert not errors
    page.close()


def test_t11_rounding_always_sums_to_100(browser):
    page, errors = open_spectator(browser, fixture_for_sequence("HHHAAAA"))
    select_live_score(page)
    assert_live_score_structure(page)
    value = evaluate_momentum(page, "HHHAAAA")
    assert (value["homePct"], value["awayPct"]) == (43, 57)
    assert value["homePct"] + value["awayPct"] == 100
    assert not errors
    page.close()


def test_t12_streak_does_not_cross_set_boundary(browser):
    data = fixture_for_sequence("HHHH")
    data["sets"][0].update({"status": "COMPLETED", "finalScore": {"our": 25, "opponent": 20}})
    data["sets"].append({"setId": "s2", "setNumber": 2, "status": "IN_PROGRESS", "initialServingTeamId": "away", "finalScore": {"our": 0, "opponent": 1}})
    data["match"]["currentSetNumber"] = 2
    rally = copy.deepcopy(data["rallies"][-1])
    rally.update({"rallyId": "s2-r1", "setId": "s2", "setNumber": 2, "rallyNumber": 1, "winnerTeamId": "away", "servingTeamId": "away", "scoreBefore": {"our": 0, "opponent": 0}, "scoreAfter": {"our": 0, "opponent": 1}, "terminalEventId": "s2-e1"})
    event = copy.deepcopy(data["events"][-1])
    event.update({"eventId": "s2-e1", "rallyId": "s2-r1", "setNumber": 2, "sequenceNumber": 100, "teamId": "away", "winnerTeamId": "away", "scoreAfter": {"our": 0, "opponent": 1}})
    data["rallies"].append(rally)
    data["events"].append(event)
    page, errors = open_spectator(browser, data)
    select_live_score(page)
    assert_live_score_structure(page)
    vm = page.evaluate("VolleySpectator.momentumView(VolleySpectator.getModel())")
    assert vm["sequence"] == ["AWAY"]
    assert vm["streak"] == {"side": "AWAY", "length": 1}
    assert page.locator("#streakText").inner_text() == "Dernier point · AS Cannes"
    assert not errors
    page.close()


def test_mobile_tablet_landscape_a11y_service_and_no_forbidden_header_colors(browser):
    data = fixture_for_sequence("HAHHAHHH")
    for viewport in ({"width": 390, "height": 844}, {"width": 768, "height": 1024}, {"width": 844, "height": 390}):
        page, errors = open_spectator(browser, data, viewport)
        select_live_score(page)
        assert_live_score_structure(page)
        page.wait_for_timeout(80)
        grid_columns = page.locator(".live-card-grid").evaluate("e => getComputedStyle(e).gridTemplateColumns.split(' ').length")
        assert grid_columns == 1
        assert page.locator("#liveScoreboard").bounding_box()["y"] < page.locator("#momentumCard").bounding_box()["y"]
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
        assert page.locator("#liveScoreboard").get_attribute("aria-label")
        assert page.locator("#momentumCard").get_attribute("aria-label")
        assert page.locator(".momentum-tile[role=listitem]").count() == 8
        assert page.locator("#serviceHome, #serviceAway").evaluate_all("els => els.filter(e => !e.hasAttribute('hidden')).length") == 1
        role_colours = page.locator(".live-overview *").evaluate_all(
            """els => els.flatMap(e => { const s=getComputedStyle(e); return [s.color,s.backgroundColor,s.borderColor]; })
              .filter(c => ['rgb(24, 184, 90)','rgb(217, 4, 41)','rgb(255, 212, 59)'].includes(c))"""
        )
        assert "rgb(24, 184, 90)" in role_colours
        assert "rgb(217, 4, 41)" in role_colours
        assert not errors
        page.close()


def test_config_monograms_order_and_section_has_no_replay_archive_text(browser):
    page, errors = open_spectator(browser, fixture_for_sequence("HAHH"))
    select_live_score(page)
    assert_live_score_structure(page)
    assert page.evaluate("VolleySpectator.config") == {"windowSize": 8, "minPoints": 4, "advantageThreshold": 0.7}
    assert page.evaluate("VolleySpectator.monogram('Fréjus')") == "F"
    assert page.evaluate("VolleySpectator.monogram('AS Cannes')") == "ASC"
    assert page.evaluate("VolleySpectator.monogram(\"Union de la Côte d'Azur\")") == "UCA"
    overview = page.locator(".live-overview").inner_text().upper()
    assert "REPLAY" not in overview and "ARCHIVE" not in overview
    assert page.locator(".team-column.home-team").bounding_box()["x"] < page.locator(".team-column.away-team").bounding_box()["x"]
    assert not errors
    page.close()


def test_live_score_visual_baselines_and_no_duplicate_score(browser, tmp_path):
    data = fixture_for_sequence("HAHHAHHH")
    viewports = {
        "phone_390x844": {"width": 390, "height": 844},
        "tablet_768x1024": {"width": 768, "height": 1024},
        "landscape_844x390": {"width": 844, "height": 390},
        "desktop_1536x1024": {"width": 1536, "height": 1024},
    }
    for name, viewport in viewports.items():
        page, errors = open_spectator(browser, data, viewport)
        select_live_score(page)
        assert_live_score_structure(page)
        assert page.locator(".spectator-brand").is_visible()
        assert page.locator(".team-crest").count() == 2
        assert page.locator("#headerHome").inner_text() == "6"
        assert page.locator("#headerAway").inner_text() == "2"
        assert page.locator("#setsHome").inner_text() == "0"
        assert page.locator("#setsAway").inner_text() == "0"
        assert "SET 1" in page.locator("#headerSet").inner_text()
        assert page.locator("#momentumCard").bounding_box()["y"] > page.locator("#liveScoreboard").bounding_box()["y"]
        page.wait_for_timeout(350)
        actual = tmp_path / f"live_score_{name}.png"
        page.screenshot(path=str(actual), full_page=True)
        baseline = ROOT / "tests" / "visual_baselines" / f"live_score_{name}_v1_26_0.png"
        assert baseline.exists(), f"Missing visual baseline {baseline.name}"
        expected = Image.open(baseline).convert("RGB")
        observed = Image.open(actual).convert("RGB")
        assert observed.size == expected.size
        diff = ImageChops.difference(expected, observed)
        assert max(ImageStat.Stat(diff).mean) < 3.0
        assert not errors
        page.close()
