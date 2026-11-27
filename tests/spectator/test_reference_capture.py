"""VolleyLive v1.26.1 SPECTATOR VIEW reference-capture acceptance rules."""
from __future__ import annotations

from spectator_support import archive_v2, open_spectator


def reference_fixture():
    data = archive_v2([
        (6, 0, "AWAY", "AWAY", "AWAY", "ATTACK", "POINT"),
        (6, 1, "HOME", "AWAY", "HOME", "ATTACK", "POINT"),
        (6, 2, "HOME", "HOME", "HOME", "BLOCK", "POINT"),
        (6, 3, "HOME", "AWAY", "HOME", "RECEPTION", "POINT"),
    ])
    data["players"][0].update({"name": "KATJA MIHAJLOVIC NOM COMPLET", "number": 12, "role": "OH"})
    return data


def test_reference_name_connectors_fixed_delta_and_attached_square(browser):
    page, errors = open_spectator(browser, reference_fixture(), {"width": 1536, "height": 1024})
    page.wait_for_timeout(250)

    for name in page.locator(".event-name").all():
        assert name.inner_text() == "KATJA MIHAJLOVIC NOM COMPLET"
        metrics = name.evaluate("e => ({whiteSpace:getComputedStyle(e).whiteSpace, client:e.clientWidth, scroll:e.scrollWidth, height:e.getBoundingClientRect().height, lineHeight:parseFloat(getComputedStyle(e).lineHeight)})")
        assert metrics["whiteSpace"] == "nowrap"
        assert metrics["scroll"] <= metrics["client"] + 1
        assert metrics["height"] <= metrics["lineHeight"] + 1

    rows = page.locator(".tl-row").evaluate_all(
        """rows => rows.map(row => {
          const rect=s=>{const e=row.querySelector(s);return e?e.getBoundingClientRect().toJSON():null};
          return {score:rect('.score-pill'), card:rect('.event-card.home'), marker:rect('.away-marker'),
                  homeConnector:rect('.timeline-connector.home'), awayConnector:rect('.timeline-connector.away'),
                  homeBar:rect('.delta-bar.home'), awayBar:rect('.delta-bar.away')};
        })"""
    )
    widths = []
    for row in rows:
        widths += [row["homeConnector"]["width"], row["awayConnector"]["width"]]
        if row["card"]:
            assert abs(row["homeConnector"]["left"] - row["card"]["right"]) < 1
            neighbour = row["homeBar"] or row["score"]
            assert abs(neighbour["left"] - row["homeConnector"]["right"]) < 1
        if row["marker"]:
            neighbour = row["awayBar"] or row["score"]
            assert abs(row["awayConnector"]["left"] - neighbour["right"]) < 1
            assert abs(row["marker"]["left"] - row["awayConnector"]["right"]) < 1
        for bar in (row["homeBar"], row["awayBar"]):
            if bar:
                assert abs(bar["width"] - 38) < 1
                if row["homeBar"]:
                    assert abs(row["score"]["left"] - row["homeBar"]["right"]) < 1
                if row["awayBar"]:
                    assert abs(row["awayBar"]["left"] - row["score"]["right"]) < 1
    assert all(abs(width - 40) < 1 for width in widths)
    assert not errors
    page.close()


def test_reference_home_away_header_boxes_are_half_size_and_equal(browser):
    page, errors = open_spectator(browser, reference_fixture(), {"width": 1536, "height": 1024})
    page.wait_for_timeout(250)
    title = page.locator(".timeline-title").bounding_box()
    home = page.locator("#homeName").bounding_box()
    away = page.locator("#awayName").bounding_box()
    assert abs(home["width"] - away["width"]) < 1
    assert title["width"] * 0.18 <= home["width"] <= title["width"] * 0.22
    assert page.locator("#homeName").evaluate("e => getComputedStyle(e).justifySelf") == "center"
    assert page.locator("#awayName").evaluate("e => getComputedStyle(e).justifySelf") == "center"
    assert not errors
    page.close()
