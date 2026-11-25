"""Setup wizard: compact, centred initial-rotation libero bench."""
from __future__ import annotations

from helpers import APP_URI


def _seed_setup_team(page):
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


def test_initial_rotation_libero_bench_is_compact_centred_and_label_removed(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    _seed_setup_team(page)
    page.reload()
    page.click("#homeSetupCapture"); page.click("#setupMatchCapture")
    page.click("#homeNew")
    page.select_option("#suTeamSelect", "Antibes U18")
    page.fill("#suOpp", "Nice")
    page.click("#suNext")
    page.click("#suNext")

    assert page.get_by_text("BANC LIBÉRO", exact=True).count() == 0
    bench = page.locator(".libero-bench").bounding_box()
    circle = page.locator(".libero-circle").bounding_box()
    court = page.locator(".setup-orange-court").bounding_box()
    assert 0 < bench["width"] - circle["width"] <= 16
    assert 0 < bench["height"] - circle["height"] <= 16
    assert circle["x"] >= bench["x"] and circle["x"] + circle["width"] <= bench["x"] + bench["width"]
    assert circle["y"] >= bench["y"] and circle["y"] + circle["height"] <= bench["y"] + bench["height"]
    assert abs((bench["x"] + bench["width"] / 2) - (court["x"] + court["width"] / 2)) < 2
    assert page.locator(".libero-seat-name").inner_text() == "SÉLECTIONNER LE LIBÉRO"
    page.locator(".libero-circle").click()
    assert page.locator('[data-lineup-player="2"]').is_visible()
    assert not errors
    page.close()


