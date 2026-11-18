"""Acceptance coverage for the v1.6.8 UI corrections."""

import json
import struct
from pathlib import Path

from helpers import ROOT, events, open_match, wait_guard


def _style(locator, properties):
    return locator.evaluate(
        "(e, ps) => Object.fromEntries(ps.map(p => [p, getComputedStyle(e)[p]]))",
        properties,
    )


def _png_size(path: Path):
    data = path.read_bytes()
    assert data[:8] == b"\x89PNG\r\n\x1a\n"
    return struct.unpack(">II", data[16:24])


def test_undo_history_and_semantic_result_blocks(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))

    undo = page.locator("#captureUndo")
    substitution = page.locator("#subToggle")
    assert undo.inner_text() == "UNDO"
    assert undo.bounding_box()["width"] == substitution.bounding_box()["width"] == 122
    assert undo.bounding_box()["height"] == substitution.bounding_box()["height"] == 36

    assert page.locator("#historyToggle").get_attribute("aria-expanded") == "false"
    assert page.locator("#historyPanel").is_hidden()

    team = page.locator('[data-vlc-actor="T"]')
    assert team.locator(":scope > *").count() == 3
    assert team.locator(":scope > button").count() == 2
    assert team.locator(":scope > .vlc-result-label").evaluate("e => e.tagName") == "DIV"
    assert team.locator('[data-vlc-result="error"]').inner_text() == "✕ ERROR\nPoint for Nice"
    assert team.locator('[data-vlc-result="point"]').inner_text() == "✓ POINT\nPoint for Antibes"
    assert float(_style(team, ["columnGap"])["columnGap"].replace("px", "")) > 0
    for item in team.locator(":scope > *").all():
        assert float(_style(item, ["borderRadius"])["borderRadius"].replace("px", "")) >= 10

    page.click('.court-grid [data-zone="p2"]')
    page.click('[data-adv-row="attack"] [data-adv-result="neutral"]')
    assert len(events(page)) == 1
    assert "Saved:" not in page.locator("#captureStatus").inner_text()
    assert page.locator("#historyPanel").is_hidden()

    page.click("#historyToggle")
    assert page.locator("#historyToggle").get_attribute("aria-expanded") == "true"
    assert page.locator("#historyPanel").is_visible()
    badge = page.locator("#captureHistory .result-badge")
    assert badge.inner_text() == "Neutral"
    assert _style(badge, ["backgroundColor", "color"]) == {
        "backgroundColor": "rgb(229, 231, 235)",
        "color": "rgb(55, 65, 81)",
    }
    assert not errors
    page.close()


def test_net_uses_page_background_and_action_labels_have_no_silhouettes(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))
    net = page.locator(".vlc-net")
    assert net.get_attribute("aria-label") == "Volleyball net"
    assert net.bounding_box()["height"] == 28
    style = _style(net, ["backgroundColor", "backgroundImage", "borderTopWidth", "borderBottomWidth"])
    assert style["backgroundColor"] == "rgba(0, 0, 0, 0)"
    assert style["backgroundImage"].count("linear-gradient") == 2
    assert style["borderTopWidth"] == "5px"
    assert style["borderBottomWidth"] == "2px"
    for pseudo in ("::before", "::after"):
        pstyle = net.evaluate(
            "(e, p) => ({height:getComputedStyle(e,p).height, background:getComputedStyle(e,p).backgroundImage})",
            pseudo,
        )
        assert pstyle["height"] == "28px"
        assert "linear-gradient" in pstyle["background"]

    page.click('.court-grid [data-zone="p2"]')
    rows = page.locator(".vlc-action-row")
    assert rows.count() == 6
    assert page.locator(".vlc-action-icon").count() == 0
    assert rows.locator(".vlc-action-name").all_inner_texts() == [
        "Attack", "Block", "Defence", "Reception", "Service", "Set\nRARE FOR OH"
    ]
    reception = page.locator('[data-adv-row="reception"] .vlc-action-copy')
    assert reception.inner_text() == "Reception"
    assert reception.evaluate("e => e.scrollWidth <= e.clientWidth")
    assert not errors
    page.close()


def test_supplied_artwork_drives_all_pwa_icons():
    expected = {
        "icons/favicon-32.png": (32, 32),
        "icons/apple-touch-icon.png": (180, 180),
        "icons/icon-192.png": (192, 192),
        "icons/icon-512.png": (512, 512),
    }
    for rel, size in expected.items():
        assert _png_size(ROOT / rel) == size

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    assert 'href="icons/apple-touch-icon.png"' in html
    assert 'href="icons/favicon-32.png"' in html
    manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert [icon["sizes"] for icon in manifest["icons"]] == ["192x192", "512x512"]
    assert all(icon["purpose"] == "any" for icon in manifest["icons"])