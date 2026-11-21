"""Unified VolleyLive JSON v2.1 contract and cross-interface acceptance."""
from __future__ import annotations

from collections import Counter, defaultdict
import json
from pathlib import Path

from helpers import APP_URI, ROOT

FIXTURE = ROOT / "statistics/data/As_cannes_vs_Frejus_2026-11-15.fixture.v2.json"
SCHEMA = ROOT / "docs/volley-live.match.schema.v2.1.json"


def payload():
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


def test_fixture_matches_official_v2_1_contract():
    document = payload()
    assert document["format"] == "volley-live"
    assert document["schemaVersion"] == "2.1.0"
    assert document["documentType"] == "match"
    assert document["match"]["status"] == "TEST_FIXTURE"
    assert document["dataQuality"]["fixture"] is True
    assert len(document["sets"]) == 2
    assert len(document["rallies"]) == 93
    assert len(document["events"]) == 365
    assert Counter(event["provenance"] for event in document["events"]) == {
        "CAPTURED": 94,
        "SYNTHETIC": 271,
    }
    assert sum(event["eventType"] == "ACTION" for event in document["events"]) == 364
    assert sum(event["eventType"] == "SUBSTITUTION" for event in document["events"]) == 1


def test_fixture_validates_against_json_schema():
    import jsonschema

    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(schema).validate(payload())


def test_event_order_provenance_and_synthetic_safety():
    document = payload()
    events = document["events"]
    assert [event["sequenceNumber"] for event in events] == list(range(1, 366))
    assert len({event["eventId"] for event in events}) == 365
    for event in events:
        if event["provenance"] == "SYNTHETIC":
            assert event["eventType"] == "ACTION"
            assert event["evaluation"] == "NEUTRAL"
            assert event["winnerTeamId"] is None
            assert event["scoreBefore"] == event["scoreAfter"]


def test_rally_scores_terminals_and_context_are_consistent():
    document = payload()
    events = {event["eventId"]: event for event in document["events"]}
    previous = defaultdict(lambda: {"our": 0, "opponent": 0})
    for rally in document["rallies"]:
        set_no = rally["setNumber"]
        assert rally["scoreBefore"] == previous[set_no]
        delta_our = rally["scoreAfter"]["our"] - rally["scoreBefore"]["our"]
        delta_opp = rally["scoreAfter"]["opponent"] - rally["scoreBefore"]["opponent"]
        assert sorted((delta_our, delta_opp)) == [0, 1]
        assert rally["setterRotationAtStart"] in {f"P{i}" for i in range(1, 7)}
        assert len(rally["onCourtPlayerIds"]) == len(set(rally["onCourtPlayerIds"])) == 6
        terminal = events[rally["terminalEventId"]]
        assert terminal["rallyId"] == rally["rallyId"]
        assert terminal["winnerTeamId"] == rally["winnerTeamId"]
        assert terminal["scoreAfter"] == rally["scoreAfter"]
        previous[set_no] = rally["scoreAfter"]


def test_role_rotation_and_recorded_server_constraints():
    document = payload()
    roles = {player["playerId"]: player["role"] for player in document["players"]}
    rallies = {rally["rallyId"]: rally for rally in document["rallies"]}
    lineups = {lineup["lineupVersionId"]: lineup for lineup in document["lineups"]}
    our_team = document["match"]["ourTeamId"]
    forbidden = {"SERVICE", "ATTACK", "BLOCK"}
    for event in document["events"]:
        if event["eventType"] != "ACTION" or event["teamId"] != our_team:
            continue
        if roles[event["playerId"]] == "LIB":
            assert event["actionType"] not in forbidden
        rally = rallies[event["rallyId"]]
        zones = lineups[rally["lineupVersionId"]]["zones"]
        if event["actionType"] == "SERVICE":
            assert event["playerId"] == zones["p1"]
        if event["actionType"] == "BLOCK":
            assert event["playerId"] in {zones["p2"], zones["p3"], zones["p4"]}


def test_home_keeps_both_required_buttons_and_v2_assets():
    home = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'id="homeCoach"' in home
    assert 'class="home-main">COACH VIEW<' in home
    assert 'id="homeStatistics"' in home
    assert 'class="home-main">ADVANCED STATISTICS<' in home
    assert 'statistics/data/reference-fixture.js' not in home
    assert 'statistics/adapter.js' in home
    assert FIXTURE.exists()


def test_both_home_buttons_open_neutral_empty_interfaces(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("localStorage.clear(); sessionStorage.clear()")
    page.reload()

    page.locator("#homeCoach").click()
    assert page.locator("#coachScreen").is_visible()
    assert page.locator("#coachLiveLabel").inner_text() == "AUCUN MATCH"
    assert "as cannes" not in page.locator("#coachContent").inner_text().lower()
    assert "Aucun match chargé" in page.locator("#coachContent").inner_text()
    page.locator("#coachHome").click()

    page.locator("#homeStatistics").click()
    page.wait_for_url("**/statistics/index.html")
    page.wait_for_selector("#statsLoader", state="attached")
    page.wait_for_selector("#statsLoader", state="hidden")
    assert "Aucun match chargé" in page.locator("#dataStatusTitle").inner_text()
    assert page.locator("#mc").inner_text() == "0"
    assert page.locator("#mr").inner_text() == "0"
    assert not errors
    page.close()
