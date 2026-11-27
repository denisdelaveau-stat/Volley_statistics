"""Portable PWA icon assets."""
import json,struct
from helpers import ROOT


def _png_size(path):
    data=path.read_bytes(); assert data[:8]==b"\x89PNG\r\n\x1a\n"; return struct.unpack(">II",data[16:24])


def test_supplied_artwork_drives_all_pwa_icons():
    expected={"icons/favicon-32.png":(32,32),"icons/apple-touch-icon.png":(180,180),"icons/icon-192.png":(192,192),"icons/icon-512.png":(512,512)}
    for rel,size in expected.items(): assert _png_size(ROOT/rel)==size
    html=(ROOT/"index.html").read_text(encoding="utf-8"); assert 'href="icons/apple-touch-icon.png"' in html and 'href="icons/favicon-32.png"' in html
    manifest=json.loads((ROOT/"manifest.webmanifest").read_text(encoding="utf-8")); assert [i["sizes"] for i in manifest["icons"]]==["192x192","512x512"]
