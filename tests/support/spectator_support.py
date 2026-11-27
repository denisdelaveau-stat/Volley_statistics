"""Spectator View test support: archive builders (volley-live v2.1 and Capture v1) and page opening."""
from __future__ import annotations

from helpers import ROOT

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
