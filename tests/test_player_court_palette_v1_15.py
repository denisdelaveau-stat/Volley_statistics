"""v1.15.0 saturated role palette, visual baseline, geometry and contrast."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops

from helpers import open_match

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "tests/visual_baselines/action_entry_court_390x844_v1_15.png"
EXPECTED = {
    "opp": ("#4fa8e8", "#0a3555"),
    "setter": ("#f2c94c", "#4a3600"),
    "oh": ("#eb6f7a", "#50141b"),
    "mb": ("#63c985", "#123d24"),
    "libero": ("#9aa5b1", "#26313d"),
}


def _rgb(value: str):
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def _luminance(rgb):
    values = [v / 255 for v in rgb]
    values = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values]
    return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2]


def _contrast(a, b):
    x, y = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (x + 0.05) / (y + 0.05)


def test_five_role_colors_are_saturated_and_wcag_aa(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    variables = page.evaluate(
        """names => Object.fromEntries(names.map(n => {
          const s=getComputedStyle(document.documentElement);
          return [n,[s.getPropertyValue('--role-'+n).trim(),s.getPropertyValue('--role-'+n+'-text').trim()]];
        }))""",
        list(EXPECTED),
    )
    assert variables == {name: list(values) for name, values in EXPECTED.items()}
    for background, text in EXPECTED.values():
        assert _contrast(_rgb(background), _rgb(text)) >= 4.5
    assert not errors
    page.close()


def test_six_circles_two_rows_spacing_separator_and_touch_size_390(browser):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    circles = page.locator(".quick-player-tray .court-grid .touch")
    assert circles.count() == 6
    boxes = [circles.nth(i).bounding_box() for i in range(6)]
    assert all(box and box["width"] >= 44 and box["height"] >= 44 for box in boxes)
    ys = sorted({round(box["y"], 1) for box in boxes})
    assert len(ys) == 2
    assert sum(abs(box["y"] - ys[0]) < 0.2 for box in boxes) == 3
    assert sum(abs(box["y"] - ys[1]) < 0.2 for box in boxes) == 3
    assert max(box["x"] + box["width"] for box in boxes[:3]) <= 390
    assert max(box["width"] for box in boxes) <= 96.1
    grid = page.locator(".quick-player-tray .court-grid").bounding_box()
    line_y = grid["y"] + grid["height"] / 2
    top_bottom = max(box["y"] + box["height"] for box in boxes if box["y"] < line_y)
    bottom_top = min(box["y"] for box in boxes if box["y"] > line_y)
    assert top_bottom < line_y - 3 and bottom_top > line_y + 3
    assert page.locator(".quick-player-tray .court-net").is_hidden()
    tray = page.locator(".quick-player-tray").bounding_box()
    change = page.locator("#subToggle").bounding_box()
    assert change["y"] >= tray["y"] + tray["height"] and change["height"] >= 44
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert not errors
    page.close()


def test_action_entry_court_visual_baseline_390(browser, tmp_path):
    page, errors = open_match(browser, "advanced", focus_off=(), viewport={"width": 390, "height": 844})
    actual = tmp_path / "court.png"
    page.locator("#capturePanel").screenshot(path=str(actual))
    assert BASELINE.exists(), "Visual baseline is missing"
    expected = Image.open(BASELINE).convert("RGB")
    observed = Image.open(actual).convert("RGB")
    assert observed.size == expected.size
    diff = ImageChops.difference(expected, observed)
    raw = diff.tobytes()
    changed = sum(1 for i in range(0, len(raw), 3) if max(raw[i:i+3]) > 10)
    assert changed / (expected.width * expected.height) < 0.001
    assert not errors
    page.close()
