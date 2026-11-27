"""v1.15.0 saturated role palette contrast."""
from __future__ import annotations

from helpers import open_match

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
    page, errors = open_match(browser, focus_off=(), viewport={"width": 390, "height": 844})
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
