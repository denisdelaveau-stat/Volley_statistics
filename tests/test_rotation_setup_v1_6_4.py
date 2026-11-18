"""v1.6.8 rotation detail, hidden-history metadata and setup acceptance tests."""
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



def _seed_team(page):
    page.evaluate("""() => {
      localStorage.clear();
      localStorage.setItem('volleyCapture.library.v1', JSON.stringify({team:{
        'Antibes U18': {team:'Antibes U18', roster:[1,2,3,4,5,6,7,8], info:{
          1:{name:'Setter',pos:'setter'}, 2:{name:'Libero',pos:'libero'},
          3:{name:'OH 1',pos:'oh'}, 4:{name:'MB 1',pos:'mb'},
          5:{name:'OH 2',pos:'oh'}, 6:{name:'MB 2',pos:'mb'},
          7:{name:'Opposite',pos:'opp'}, 8:{name:'Reserve OH',pos:'oh'}
        }}
      }}));
    }""")


def test_settings_and_new_match_sequence(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    _seed_team(page)
    page.reload()

    page.click("#homeSettings")
    page.click('[data-setting-format="2"]')
    page.select_option("#settingsLevel", "intermediate")
    assert page.locator("#settingsLevel").evaluate("e => getComputedStyle(e).backgroundColor") == "rgb(254, 249, 195)"
    page.click("#settingsSave")
    page.click("#settingsBack")

    page.click("#homeNew")
    assert page.locator("#suS1").inner_text() == "1 SELECT TEAM"
    assert page.locator(".confirm-player").count() == 8
    assert page.locator("[data-present]").count() == 8
    assert page.locator("[data-focus]").count() == 8
    page.fill("#suOpp", "Nice")
    page.uncheck('[data-focus="7"]')
    page.click("#suNext")

    assert page.locator("#setterZone").input_value() == "p1"
    assert page.locator(".rotation-card").count() == 6
    assert page.locator(".rotation-card .role").all_inner_texts() == ["OPP", "MB1", "OH1", "OH2", "MB2", "SET"]
    page.click('[data-first="reception"]')
    assert page.locator(".rotation-card .lib-note").count() == 1
    page.click("#suNext")

    match = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
    assert match["detailLevel"] == "intermediate"
    assert match["format"]["setsToWin"] == 2
    assert match["startingRotation"] == {"p1": 1, "p2": 3, "p3": 4, "p4": 7, "p5": 5, "p6": 6}
    assert match["startingLineup"]["libero"] == 2
    assert match["firstRally"]["antibesState"] == "reception"
    assert match["team"]["roster"][7]["focus"] is False
    assert not errors
    page.close()
