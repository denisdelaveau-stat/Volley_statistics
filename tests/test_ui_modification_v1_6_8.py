"""v1.12 quick entry, player tray and portable assets."""
import json,struct
from pathlib import Path
from helpers import ROOT,events,open_match


def _style(locator,props): return locator.evaluate("(e,p)=>Object.fromEntries(p.map(x=>[x,getComputedStyle(e)[x]]))",props)
def _png_size(path):
    data=path.read_bytes(); assert data[:8]==b"\x89PNG\r\n\x1a\n"; return struct.unpack(">II",data[16:24])


def test_undo_history_and_three_result_blocks(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    assert page.locator("[data-quick-result]").all_inner_texts()==["✓\nPOINT","✕\nERROR","○\nCONTINUE"]
    colours={"point":"rgb(22, 163, 74)","neutral":"rgb(37, 99, 235)","error":"rgb(220, 38, 38)"}
    for result,color in colours.items(): assert _style(page.locator(f'[data-quick-result="{result}"]'),["backgroundColor"])["backgroundColor"]==color
    page.click('.court-grid [data-zone="p2"]'); page.click('[data-quick-action="attack"]'); page.click('[data-quick-result="neutral"]')
    assert len(events(page))==1 and page.locator("#historyPanel").is_hidden(); page.click("#historyToggle")
    assert page.locator("#historyPanel").is_visible() and page.locator("#captureHistory .result-badge").inner_text()=="Neutral"
    assert not errors; page.close()


def test_blue_player_tray_and_round_pastel_players(browser):
    page, errors=open_match(browser,"advanced",focus_off=())
    tray=_style(page.locator(".quick-player-tray"),["backgroundColor","borderRadius"]); assert tray["backgroundColor"]=="rgb(10, 41, 74)"
    for player in page.locator(".court-grid [data-player]").all():
        box=player.bounding_box(); assert abs(box["width"]-box["height"])<1.5; assert _style(player,["borderRadius"])["borderRadius"]=="50%"
    assert not errors; page.close()


def test_supplied_artwork_drives_all_pwa_icons():
    expected={"icons/favicon-32.png":(32,32),"icons/apple-touch-icon.png":(180,180),"icons/icon-192.png":(192,192),"icons/icon-512.png":(512,512)}
    for rel,size in expected.items(): assert _png_size(ROOT/rel)==size
    html=(ROOT/"index.html").read_text(); assert 'href="icons/apple-touch-icon.png"' in html and 'href="icons/favicon-32.png"' in html
    manifest=json.loads((ROOT/"manifest.webmanifest").read_text()); assert [i["sizes"] for i in manifest["icons"]]==["192x192","512x512"]
