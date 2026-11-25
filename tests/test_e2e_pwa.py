"""Cross-feature regression checks for score, set lock, Undo, report and cache version."""
from pathlib import Path
from helpers import ROOT, events, open_match, wait_guard, CACHE_NAME


def scoring_event(idx, winner, a, b):
    player = "T" if winner == "team1" else "A"
    return {
        "id": idx, "set": 1, "timestamp": "2026-11-16T12:00:00Z", "time": "12:00:00",
        "action": "team" if player == "T" else "adverse", "result": "point", "player": player,
        "winningTeam": winner, "pointOrigin": "earned", "scoreA": a, "scoreB": b,
    }


def _point(page, author):
    page.locator(f'[data-runtime-author="{author}"]').click()
    page.locator('[data-runtime-action="attack"]').click()
    page.locator('[data-runtime-result="point"]').click()
    page.wait_for_timeout(600)


def test_set_end_undo_and_exports(browser):
    seed, a, b = [], 0, 0
    for i in range(48):
        if i % 2 == 0:
            a += 1; winner = "team1"
        else:
            b += 1; winner = "team2"
        seed.append(scoring_event(i + 1, winner, a, b))
    page, errors = open_match(browser, events=seed)
    assert page.locator("#liveScore .digit-box").all_inner_texts() == ["24", "24"]
    _point(page, "3")
    _point(page, "3")
    assert "locked" in page.get_attribute("#capturePanel", "class")
    assert "SET 1 FINISHED" in page.inner_text("#setOverTitle")
    count = len(events(page))
    page.evaluate("""() => {
      document.querySelector('[data-runtime-author="A"]')?.click();
      document.querySelector('[data-runtime-action="attack"]')?.click();
      document.querySelector('[data-runtime-result="point"]')?.click();
    }""")
    assert len(events(page)) == count

    page.click("#historyToggle")
    page.click("[data-delete-last]")
    assert len(events(page)) == count - 1
    assert "locked" not in page.get_attribute("#capturePanel", "class")
    report = page.evaluate("window.buildMatchReport()")
    assert "Antibes vs Nice" in report and "Action log" in report and "25 : 24" in report
    assert page.evaluate("typeof window.saveMatchJson") == "function"
    assert not errors
    page.close()


def test_pwa_cache_version_and_shell_assets():
    service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")
    assert CACHE_NAME in service_worker
    assert "coach.css" in service_worker
    assert "coach.js" in service_worker
    assert "As_cannes_vs_Frejus_2026-11-15.fixture.v2.json" in service_worker
    assert "reference-fixture.js" in service_worker
    for asset in ("index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"):
        assert asset in service_worker
        assert (ROOT / asset).exists()
