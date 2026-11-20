"""Cross-feature regression checks for score, set lock, Undo, report and cache version."""
from pathlib import Path
from helpers import ROOT, events, open_match, wait_guard


def scoring_event(idx, winner, a, b):
    player = "T" if winner == "team1" else "A"
    return {
        "id": idx, "set": 1, "timestamp": "2026-11-16T12:00:00Z", "time": "12:00:00",
        "action": "team" if player == "T" else "adverse", "result": "point", "player": player,
        "winningTeam": winner, "pointOrigin": "earned", "scoreA": a, "scoreB": b,
    }


def test_set_end_undo_and_exports(browser):
    seed, a, b = [], 0, 0
    for i in range(48):
        if i % 2 == 0:
            a += 1; winner = "team1"
        else:
            b += 1; winner = "team2"
        seed.append(scoring_event(i + 1, winner, a, b))
    page, errors = open_match(browser, "basic", events=seed)
    assert page.locator("#liveScore .digit-box").all_inner_texts() == ["24", "24"]
    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    wait_guard(page)
    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert "locked" in page.get_attribute("#capturePanel", "class")
    assert "SET 1 FINISHED" in page.inner_text("#setOverTitle")
    count = len(events(page))
    page.evaluate("document.querySelector('[data-vlc-actor=\"A\"] [data-vlc-result=\"point\"]').click()")
    assert len(events(page)) == count

    page.click("#captureUndo")
    assert len(events(page)) == count - 1
    assert "locked" not in page.get_attribute("#capturePanel", "class")
    report = page.evaluate("window.buildMatchReport()")
    assert "Antibes vs Nice" in report and "Action log" in report and "25 : 24" in report
    assert page.evaluate("typeof window.saveMatchJson") == "function"
    assert not errors
    page.close()


def test_pwa_cache_version_and_shell_assets():
    service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")
    assert "volley-live-capture-v1.10.0" in service_worker
    assert "coach.css" in service_worker
    assert "coach.js" in service_worker
    assert "As_cannes_vs_Frejus_2026-11-15.fixture.v2.json" in service_worker
    assert "reference-fixture.js" in service_worker
    for asset in ("index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"):
        assert asset in service_worker
        assert (ROOT / asset).exists()
