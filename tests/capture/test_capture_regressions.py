"""Cross-feature regression checks for score, set lock, Undo, report and cache version."""
import json
import re
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
    # Runtime input ignores taps for 500 ms after each commit (double-tap guard).
    page.wait_for_timeout(600)


def _score(page):
    return page.locator("#liveScore .digit-box").all_inner_texts()


def _locked(page):
    return "locked" in (page.get_attribute("#capturePanel", "class") or "")


def test_set_end_lock_undo_next_set_and_exports(browser):
    """24-24 in set 1: the set needs a two-point lead, locks the capture once won, can be reopened by deleting the
    last action, then set 2 starts at 0-0; the HTML report and the JSON file describe the match."""
    seed, a, b = [], 0, 0
    for i in range(48):
        if i % 2 == 0:
            a += 1; winner = "team1"
        else:
            b += 1; winner = "team2"
        seed.append(scoring_event(i + 1, winner, a, b))
    page, errors = open_match(browser, events=seed, viewport={"width": 1180, "height": 820})
    assert _score(page) == ["24", "24"]

    # 25-24 is not enough (two-point lead), 26-24 wins the set and locks the capture.
    _point(page, "3")
    assert _score(page) == ["25", "24"] and not _locked(page)
    assert page.locator("#setOver").is_hidden()
    _point(page, "3")
    assert _score(page) == ["26", "24"] and _locked(page)
    assert page.inner_text("#setOverTitle") == "SET 1 TERMINÉ"
    assert "26-24" in page.inner_text("#setOverText") and "Sets 1 : 0" in page.inner_text("#setOverText")
    assert page.inner_text("#nextSetBtn") == "DÉMARRER LE SET 2 →"

    # A locked set refuses new actions.
    count = len(events(page))
    page.evaluate("""() => {
      document.querySelector('[data-runtime-author="A"]')?.click();
      document.querySelector('[data-runtime-action="attack"]')?.click();
      document.querySelector('[data-runtime-result="point"]')?.click();
    }""")
    assert len(events(page)) == count

    # Deleting the last action reopens the set at 25-24; scoring goes on (25-25).
    page.click("#historyToggle")
    page.click("[data-delete-last]")
    wait_guard(page)
    assert len(events(page)) == count - 1
    assert _score(page) == ["25", "24"] and not _locked(page)
    assert page.locator("#setOver").is_hidden()
    _point(page, "A")
    assert _score(page) == ["25", "25"]
    _point(page, "3")
    _point(page, "3")
    assert _score(page) == ["27", "25"] and _locked(page)

    # Exports describe the finished set.
    report = page.evaluate("VolleyCapture.buildReport()")
    for text in ("Antibes vs Nice", "Journal des actions"):
        assert text in report, text
    # Sets table: set 1, 27-25, won by Antibes.
    assert re.search(r"Set 1</td>\s*<td[^>]*>27</td>\s*<td[^>]*>25</td>\s*<td[^>]*>Antibes</td>", report)
    with page.expect_download() as download:
        page.evaluate("VolleyShell.saveMatchJson()")
    saved = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))
    assert saved["format"] == "volley-live-capture" and saved["version"] == 1
    assert len(saved["events"]) == len(events(page))
    assert saved["score"] == {"team1": 27, "team2": 25}

    # Next set: the line-up sheet opens (tests/capture/test_set_lineup.py); confirming the previous line-up starts
    # set 2 at 0-0, capture open again, one set won.
    page.click("#nextSetBtn")
    page.click("[data-lineup-confirm]")
    page.wait_for_load_state()
    page.wait_for_timeout(300)
    assert _score(page) == ["0", "0"] and not _locked(page)
    assert page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1')).currentSet") == 2
    assert page.locator("#liveScore .set-badge").all_inner_texts() == ["1", "0"]
    _point(page, "3")
    assert _score(page) == ["1", "0"]
    assert not errors, errors
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
