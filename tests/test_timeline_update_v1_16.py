"""v1.16.0 LIVE TIMELINE update from the `time line.docx` acceptance rules."""
from __future__ import annotations

from test_spectator_timeline_v1_15 import archive_v2, open_spectator


def test_away_point_and_fault_are_only_coloured_a_circles(browser):
    data = archive_v2([
        (1, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (1, 1, "HOME", "AWAY", "AWAY", "SERVICE", "ERROR"),
    ])
    page, errors = open_spectator(browser, data)
    markers = page.locator(".away-marker")
    assert markers.count() == 2
    assert markers.evaluate_all("els => els.map(e => e.innerText.trim())") == ["A", "A"]
    assert markers.nth(0).get_attribute("class").endswith("point")
    assert markers.nth(1).get_attribute("class").endswith("error")
    assert page.locator(".away-slot .event-card").count() == 0
    assert page.locator(".away-slot .event-copy").count() == 0
    assert "ACTION GAGNANTE" not in page.locator("#timelineList").inner_text()
    assert page.locator(".away-slot").evaluate_all("els => els.map(e => e.innerText.trim())") == ["A", "A"]
    assert not errors
    page.close()


def test_home_attack_point_error_neutral_shows_only_attaque(browser):
    data = archive_v2([
        (0, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (1, 1, "AWAY", "HOME", "HOME", "ATTACK", "ERROR"),
        (1, 2, "HOME", "AWAY", "HOME", "ATTACK", "NEUTRAL"),
    ])
    page, errors = open_spectator(browser, data)
    actions = page.locator(".home-action")
    assert actions.count() == 3
    assert actions.all_inner_texts() == ["ATTAQUE", "ATTAQUE", "ATTAQUE"]
    assert actions.evaluate_all("els => els.map(e => e.classList.item(1))") == ["point", "error", "neutral"]
    text = page.locator("#timelineList").inner_text()
    assert "GAGNANTE" not in text and "OUT" not in text and "✓" not in text and "×" not in text
    assert not errors
    page.close()


def test_score_colours_only_the_scoring_half_for_home_and_away_so_bp(browser):
    data = archive_v2([
        (0, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),   # HOME SO yellow
        (1, 1, "AWAY", "HOME", "AWAY", "ATTACK", "POINT"),   # AWAY SO yellow
        (1, 2, "HOME", "HOME", "HOME", "ATTACK", "POINT"),   # HOME BP green
        (2, 2, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),   # AWAY BP red
    ])
    page, errors = open_spectator(browser, data)
    assert page.locator(".chip").count() == 0
    rows = page.locator(".tl-row")
    expected = [
        ("rgb(5, 7, 11)", "rgb(245, 197, 66)"),
        ("rgb(245, 197, 66)", "rgb(5, 7, 11)"),
        ("rgb(5, 7, 11)", "rgb(21, 128, 61)"),
        ("rgb(185, 28, 28)", "rgb(5, 7, 11)"),
    ]
    observed = rows.evaluate_all(
        "rows => rows.map(r => [getComputedStyle(r.querySelector('.score-half.away')).backgroundColor, getComputedStyle(r.querySelector('.score-half.home')).backgroundColor])"
    )
    assert observed == [list(x) for x in expected]
    assert rows.evaluate_all("rows => rows.map(r => [r.dataset.code, r.dataset.winner])") == [
        ["SO", "HOME"], ["SO", "AWAY"], ["BP", "HOME"], ["BP", "AWAY"]
    ]
    assert not errors
    page.close()


def test_connector_is_score_centred_and_stops_at_score_edge(browser):
    data = archive_v2([
        (1, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (1, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
    ])
    page, errors = open_spectator(browser, data, viewport={"width": 1536, "height": 1024})
    geometry = page.locator(".tl-row").evaluate_all(
        """rows => rows.map(r => {
          const slot = r.querySelector('.event-slot.has-event').getBoundingClientRect();
          const pill = r.querySelector('.score-pill').getBoundingClientRect();
          const event = r.querySelector('.away-marker,.event-card').getBoundingClientRect();
          const away = !!r.querySelector('.away-slot.has-event');
          return {away, slotCenter:(slot.top+slot.bottom)/2, pillCenter:(pill.top+pill.bottom)/2,
                  slotLeft:slot.left, slotRight:slot.right, pillLeft:pill.left, pillRight:pill.right,
                  eventLeft:event.left, eventRight:event.right};
        })"""
    )
    for g in geometry:
        assert abs(g["slotCenter"] - g["pillCenter"]) < 1
        if g["away"]:
            assert 26 <= g["pillLeft"] - g["slotRight"] <= 28
            assert g["eventRight"] <= g["slotRight"] <= g["pillLeft"]
        else:
            assert 26 <= g["slotLeft"] - g["pillRight"] <= 28
            assert g["pillRight"] <= g["slotLeft"] <= g["eventLeft"]
    assert not errors
    page.close()


def test_vivid_shared_role_colours_and_contrast(browser):
    data = archive_v2([
        (0, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (0, 2, "HOME", "HOME", "HOME", "ATTACK", "POINT"),
        (0, 3, "HOME", "HOME", "HOME", "ATTACK", "POINT"),
        (0, 4, "HOME", "HOME", "HOME", "ATTACK", "POINT"),
        (0, 5, "HOME", "HOME", "HOME", "ATTACK", "POINT"),
    ])
    roles = ["OPP", "SET", "OH", "MB", "LIB"]
    data["players"] = [
        {"playerId": f"p{i}", "teamId": "home", "number": i, "name": f"Player {r}", "role": r}
        for i, r in enumerate(roles, 1)
    ]
    for i, event in enumerate(data["events"], 1):
        event["playerId"] = f"p{i}"
    page, errors = open_spectator(browser, data)
    avatars = page.locator(".avatar")
    assert avatars.count() == 5
    expected = ["rgb(79, 168, 232)", "rgb(242, 201, 76)", "rgb(235, 111, 122)", "rgb(99, 201, 133)", "rgb(154, 165, 177)"]
    assert avatars.evaluate_all("els => els.map(e => getComputedStyle(e).backgroundColor)") == expected
    ratios = avatars.evaluate_all(
        r"""els => {
          const rgb=s=>s.match(/\d+/g).slice(0,3).map(Number);
          const lum=s=>{const c=rgb(s).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*c[0]+.7152*c[1]+.0722*c[2]};
          return els.map(e=>{const s=getComputedStyle(e),a=lum(s.color),b=lum(s.backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
        }"""
    )
    assert all(ratio >= 4.5 for ratio in ratios)
    assert not errors
    page.close()


def test_basic_does_not_invent_actions_and_filters_keep_latest_window(browser):
    rows = [(i, 0, "AWAY", "AWAY") for i in range(1, 8)]
    page, errors = open_spectator(browser, archive_v2(rows, basic=True))
    assert page.locator(".event-card,.away-marker,.home-action").count() == 0
    assert page.locator(".tl-row").count() == 5
    assert page.locator(".tl-row").first.get_attribute("data-rally") == "3"
    page.locator('[data-order="newestFirst"]').click()
    page.locator("#windowSize").select_option("all")
    assert page.locator(".tl-row").count() == 7
    assert page.locator(".tl-row").first.get_attribute("data-rally") == "7"
    assert page.locator(".tl-row").first.locator(".last-point").count() == 1
    assert not errors
    page.close()
