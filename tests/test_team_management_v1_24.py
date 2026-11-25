"""Team Management coverage retained under Setup & Capture in v1.26.0."""
from pathlib import Path

from helpers import APP_URI


ROOT = Path(__file__).resolve().parents[1]


def open_team_management(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("dialog", lambda dialog: dialog.accept())
    page.goto(APP_URI)
    page.evaluate("localStorage.clear()")
    page.reload()
    page.click("#homeSetupCapture"); page.click("#setupTeamManagement")
    return page, errors


def test_team_management_shell_matches_requested_information_architecture(browser):
    page, errors = open_team_management(browser)
    assert " ".join(page.locator("#teamsTitle").inner_text().split()) == "TEAM MANAGEMENT"
    assert page.locator("#teamNew").is_visible()
    assert page.locator("#teamNew").inner_text().startswith("＋\nNEW TEAM")
    assert page.locator("#teamOverview").inner_text().find("REGISTERED TEAMS") > 0
    assert page.locator("#teamImport").is_visible()
    assert "Numero, Nom, Poste" in page.locator("#teamImport").inner_text()
    assert page.locator("#teamCsvFile").get_attribute("accept") == ".csv,text/csv"
    assert not errors
    page.close()


def test_add_validate_sort_save_and_reopen_team(browser):
    page, errors = open_team_management(browser)
    page.click("#teamNew")
    page.click("#teamAdd")
    assert "Numero must be" in page.locator("#teamsMsg").inner_text()

    players = [(12, "Zoé Martin", "oh"), (3, "Alice Bernard", "setter"), (8, "Marc Durand", "mb")]
    for number, name, position in players:
        page.fill("#teamPlayerNumber", str(number))
        page.fill("#teamPlayerName", name)
        page.select_option("#teamPlayerPosition", position)
        page.click("#teamAdd")

    assert page.locator("#teamRoster .tm-player-row").count() == 3
    assert page.locator("#teamRoster .tm-player-number").all_inner_texts() == ["3", "8", "12"]
    page.click('[data-team-sort="name"]')
    assert page.locator("#teamRoster .tm-player-name strong").all_inner_texts() == ["Alice Bernard", "Marc Durand", "Zoé Martin"]
    page.click('[data-team-sort="pos"]')
    assert page.locator("#teamRoster .tm-role-pill").all_inner_texts() == ["SET", "OH", "MB"]

    page.fill("#teamName", "Cannes Espoir")
    page.click("#teamsSave")
    page.wait_for_function("() => !document.querySelector('#teamOverview').hidden")
    assert page.locator('[data-team-open="Cannes Espoir"]').is_visible()
    page.click('[data-team-open="Cannes Espoir"]')
    assert page.locator("#teamName").input_value() == "Cannes Espoir"
    assert page.locator("#teamRoster .tm-player-row").count() == 3
    assert not errors
    page.close()


def test_csv_import_maps_french_headers_and_roles(browser):
    page, errors = open_team_management(browser)
    csv = "Numero;Nom;Poste\n1;Lina Petit;Passeur\n9;Eva Roux;Libéro\n14;Nora Blanc;Pointue\n"
    page.locator("#teamCsvFile").set_input_files({
        "name": "Equipe_Azur.csv",
        "mimeType": "text/csv",
        "buffer": csv.encode("utf-8"),
    })
    page.wait_for_function("() => !document.querySelector('#teamEditor').hidden")
    assert page.locator("#teamName").input_value() == "Equipe Azur"
    assert page.locator("#teamRoster .tm-player-row").count() == 3
    assert page.locator("#teamRoster .tm-role-pill").all_inner_texts() == ["SET", "LIB", "OPP"]
    assert "3 players imported" in page.locator("#teamsMsg").inner_text()
    assert not errors
    page.close()


def test_offline_shell_includes_team_management_styles():
    service_worker = (ROOT / "sw.js").read_text()
    index = (ROOT / "index.html").read_text()
    css = (ROOT / "team-management.css").read_text()
    assert "volley-live-capture-v1.28.0" in service_worker
    assert "team-management.css" in service_worker
    assert '<link rel="stylesheet" href="team-management.css">' in index
    assert "--tm-cyan:#12d7f2" in css
    assert ".tm-new-card" in css
