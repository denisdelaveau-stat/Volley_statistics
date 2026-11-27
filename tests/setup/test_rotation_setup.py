"""Setup wizard: initial rotation, libero bench and settings-to-new-match sequence."""
from helpers import APP_URI


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


def test_initial_rotation_has_default_grey_libero_circle_on_centred_bench(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    _seed_team(page)
    page.reload()
    page.click("#homeSetupCapture"); page.click("#setupMatchCapture")
    page.click("#homeNew")
    page.select_option("#suTeamSelect", "Antibes U18")
    page.fill("#suOpp", "Nice")
    page.click("#suNext")
    page.click("#suNext")

    circle = page.locator(".libero-circle")
    bench = page.locator(".libero-setup")
    assert circle.inner_text() == "L"
    assert page.locator(".libero-seat-name").inner_text() == "SÉLECTIONNER LE LIBÉRO"
    assert circle.evaluate("e => getComputedStyle(e).backgroundColor") == "rgb(154, 165, 177)"
    box = bench.bounding_box()
    assert abs((box["x"] + box["width"] / 2) - 195) < 2
    page.click('[data-rotation-role="libero"]')
    assert page.locator('[data-lineup-player="2"]').is_visible()
    assert not errors
    page.close()


def test_settings_and_new_match_sequence(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    _seed_team(page)
    page.reload()

    page.click("#homeSettings")
    page.click('[data-setting-format="2"]')
    assert page.locator("#settingsLevel").count() == 0
    page.click("#settingsSave")
    page.click("#settingsBack")

    page.click("#homeSetupCapture"); page.click("#setupMatchCapture")
    page.click("#homeNew")
    assert page.locator("#suTitle").inner_text() == "Sélectionne ton équipe"
    assert page.locator(".su-steps").is_hidden()
    page.select_option("#suTeamSelect", "Antibes U18")
    page.fill("#suOpp", "Nice")
    assert "Antibes U18_vs_Nice" in page.locator("#suName").input_value()
    assert page.locator("#suNext").inner_text() == "VALIDER"
    page.click("#suNext")

    assert page.locator("#suS1").inner_text() == "2 ÉQUIPE"
    assert page.locator("#suS1").get_attribute("class") == "on"
    assert page.locator(".roster-player").count() == 8
    assert page.locator("[data-present]").count() == 8
    assert page.locator("[data-focus]").count() == 8
    page.select_option("#rosterSort", "name")
    assert page.locator(".roster-player-name").first.inner_text() == "Libero"
    page.uncheck('[data-focus="7"]')
    page.click("#suNext")

    assert page.locator('[data-setter-zone="p1"]').get_attribute("class") == "active"
    assert page.locator(".rotation-slot").count() == 6
    assert page.locator(".rotation-slot-role").all_inner_texts() == ["OPP", "MB 1", "OH 1", "OH 2", "MB 2", "PASSEUR"]
    assert page.locator(".rotation-slot.filled").count() == 0
    assert page.locator(".rotation-slot.setter-empty").count() == 1

    for role, number in (
        ("setter", 1), ("oh1", 3), ("mb1", 4), ("opp", 7),
        ("oh2", 5), ("mb2", 6), ("libero", 2),
    ):
        page.click(f'[data-rotation-role="{role}"]')
        page.click(f'[data-lineup-player="{number}"]')

    assert page.locator("#suNext").is_hidden()
    page.click('[data-first="reception"]')
    assert page.locator("#suNext").is_visible()
    assert page.locator("#suNext").inner_text() == "DÉMARRER LE MATCH"
    page.click("#suNext")

    match = page.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
    assert match["detailLevel"] == "advanced"
    assert match["format"]["setsToWin"] == 2
    assert match["startingRotation"] == {"p1": 1, "p2": 3, "p3": 4, "p4": 7, "p5": 5, "p6": 6}
    assert match["startingLineup"]["libero"] == 2
    assert match["firstRally"]["antibesState"] == "reception"
    assert match["team"]["roster"][7]["focus"] is False
    assert not errors
    page.close()
