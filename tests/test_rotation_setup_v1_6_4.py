"""v1.6.6 rotation detail, hidden-history metadata and setup acceptance tests."""
from helpers import APP_URI, events, open_match, wait_guard


def test_rotation_is_plain_centred_and_persisted_per_event(browser):
    page, errors = open_match(browser, "advanced", focus_off=(4,))
    status = page.locator("#courtStatus")
    assert status.inner_text() == "Rot. P1 | R1 | C1"
    style = status.evaluate(
        "e => ({background:getComputedStyle(e).backgroundColor, color:getComputedStyle(e).color, align:getComputedStyle(e).textAlign})"
    )
    assert style == {"background": "rgba(0, 0, 0, 0)", "color": "rgb(0, 0, 0)", "align": "center"}
    score_box = page.locator("#liveScore").bounding_box()
    rotation_box = status.bounding_box()
    assert abs((score_box["x"] + score_box["width"] / 2) - (rotation_box["x"] + rotation_box["width"] / 2)) < 2

    page.click('[data-vlc-actor="A"] [data-vlc-result="point"]')
    wait_guard(page)
    page.click('[data-vlc-actor="T"] [data-vlc-result="point"]')
    assert status.inner_text() == "Rot. P6 | R2 | C1"
    wait_guard(page)
    page.click('[data-vlc-actor="A"] [data-vlc-result="point"]')

    saved = events(page)
    assert [event["rotation"] for event in saved] == [0, 0, 1]
    assert page.locator(".history thead th").all_inner_texts() == [
        "#", "Player", "Action", "Result", "Score"
    ]
    rows = page.locator("#captureHistory tr")
    assert rows.nth(0).locator("td").count() == 5
    assert rows.nth(0).locator("td").nth(1).inner_text() == "A"
    assert [event["rotation"] for event in saved] == [0, 0, 1]
    assert not errors
    page.close()


def test_setup_detail_colours_and_configurable_roster_maximum(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate(
        """() => {
          localStorage.clear();
          sessionStorage.setItem('volleyCapture.stage', 'setup');
        }"""
    )
    page.reload()

    level = page.locator("#suLevel")
    assert level.input_value() == "advanced"
    assert level.evaluate("e => getComputedStyle(e).backgroundColor") == "rgb(254, 226, 226)"
    level.select_option("intermediate")
    level = page.locator("#suLevel")
    assert level.evaluate("e => getComputedStyle(e).backgroundColor") == "rgb(254, 249, 195)"

    roster_max = page.locator("#suRosterMax")
    assert roster_max.input_value() == "12"
    assert roster_max.locator("option").last.inner_text() == "30"
    assert page.locator('[data-n="30"]').count() == 1
    roster_max.select_option("8")
    for number in range(1, 9):
        page.locator(f'[data-n="{number}"]').click()
    assert page.locator(".roster-card [data-n].sel").count() == 8
    assert page.locator('[data-n="9"]').is_disabled()
    assert "8 / 8 selected (min 7, max 8)" in page.locator(".roster-card").inner_text()

    page.locator("#suLevel").select_option("basic")
    level = page.locator("#suLevel")
    assert level.evaluate("e => getComputedStyle(e).backgroundColor") == "rgb(220, 252, 231)"
    assert page.locator("#suRosterMax").count() == 0
    assert not errors
    page.close()
