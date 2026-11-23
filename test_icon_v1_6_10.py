"""Pixel and PWA acceptance coverage for the v1.6.10 borderless icon correction retained in v1.7.0."""
from pathlib import Path
import json

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
EXPECTED = {
    "apple-touch-icon.png": 180,
    "favicon-32.png": 32,
    "icon-192.png": 192,
    "icon-512.png": 512,
}


def outer_band(a, width):
    return np.concatenate((
        a[:width].reshape(-1, 3), a[-width:].reshape(-1, 3),
        a[:, :width].reshape(-1, 3), a[:, -width:].reshape(-1, 3),
    ))


def test_icons_are_full_square_opaque_and_borderless():
    for name, size in EXPECTED.items():
        image = Image.open(ICONS / name)
        assert image.size == (size, size)
        assert image.mode == "RGB"
        a = np.asarray(image)
        corners = np.array([a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]])
        assert np.max(corners.mean(axis=1)) < 90
        band = outer_band(a, max(1, size // 32))
        near_white = np.all(band > 225, axis=1)
        # Small ball/arc highlights may meet an edge after removing the baked mask;
        # a pale perimeter would occupy a material share of the complete edge band.
        assert near_white.mean() < 0.01


def test_master_preserves_source_interior_and_replaces_outer_mask():
    source = np.asarray(Image.open(ICONS / "IMG_5596.PNG").convert("RGB"))
    master_image = Image.open(ICONS / "icon-master-v1.6.10.png")
    assert master_image.mode == "RGB"
    master = np.asarray(master_image)
    assert master.shape == source.shape == (1254, 1254, 3)
    expected = np.asarray(Image.fromarray(source).crop((96, 96, 1158, 1158)).resize((1254, 1254), Image.Resampling.LANCZOS))
    assert np.array_equal(master, expected)
    assert master[0, 0].mean() < 90
    assert source[0, 0].mean() > 225


def test_manifest_html_and_service_worker_reference_correct_assets():
    manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
    assert [item["src"] for item in manifest["icons"]] == [
        "icons/icon-192.png", "icons/icon-512.png"
    ]
    assert all(item["purpose"] == "any" for item in manifest["icons"])
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    for name in ("apple-touch-icon.png", "favicon-32.png", "icon-192.png"):
        assert f"icons/{name}" in html
    service_worker = (ROOT / "sw.js").read_text(encoding="utf-8")
    assert "volley-live-capture-v1.20.0" in service_worker
    for name in EXPECTED:
        assert f"icons/{name}" in service_worker
