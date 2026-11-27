from helpers import APP_URI


def test_saturated_role_palette_and_coach_setup_background(browser):
    page = browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(APP_URI)
    page.evaluate("""localStorage.setItem('volleyCapture.library.v1', JSON.stringify({team:{'Saturated Club':{team:'Saturated Club',roster:[1,2,3,4,5,6,7],info:{1:{name:'Set',pos:'setter'},2:{name:'Lib',pos:'libero'},3:{name:'OH1',pos:'oh'},4:{name:'OH2',pos:'oh'},5:{name:'MB1',pos:'mb'},6:{name:'MB2',pos:'mb'},7:{name:'Opp',pos:'opp'}}}}}))""")
    page.click('#homeSetupCapture'); page.click('#setupMatchCapture')
    page.click('#homeNew')
    assert page.locator('#setupScreen').get_attribute('data-setup-step') == '0'
    background = page.locator('#setupScreen').evaluate("e => getComputedStyle(e).backgroundImage")
    assert 'gradient' in background
    assert 'rgb(6, 26, 51)' in background or 'rgb(7, 31, 59)' in background
    page.select_option('#suTeamSelect', 'Saturated Club')
    page.fill('#suOpp', 'Rivals')
    page.click('#suNext')
    assert page.locator('#setupScreen').get_attribute('data-setup-step') == '1'
    expected = {'setter':'rgb(242, 201, 76)','oh':'rgb(235, 111, 122)','mb':'rgb(99, 201, 133)','opp':'rgb(79, 168, 232)','libero':'rgb(154, 165, 177)'}
    court = page.locator('.roster-court').evaluate("e => getComputedStyle(e).backgroundImage")
    assert 'rgb(255, 174, 99)' in court or 'rgb(241, 138, 66)' in court
    for role, color in expected.items():
        node = page.locator('.roster-player.role-' + role).first
        assert node.locator('.roster-ball').evaluate("e => getComputedStyle(e).backgroundColor") == color
    assert not errors
    page.close()


def test_theme_css_preserves_orange_courts_and_coloured_actions():
    from pathlib import Path
    root = Path(__file__).resolve().parents[2]
    from helpers import compact_css
    css = compact_css((root / 'index.html').read_text(encoding='utf-8') + ''.join(
        p.read_text(encoding='utf-8') for p in sorted((root / 'css').glob('index-*.css'))))
    for snippet in (
        '#setupScreen .su-card{background:rgba(10,43,75,.9)',
        '#setupScreen .rotation-picker{background:#102f50',
        '#setupScreen .su-card input[type=text],#setupScreen .su-select{background:#123b60',
        '.roster-court{position:relative',
        '.setup-orange-court{position:relative',
    ):
        assert compact_css(snippet) in css, snippet
    for colour in ('#ffae63', '#f18a42', '#ffad62', '#ed8845'):
        assert colour in css, colour
    assert compact_css('#setupScreen .btn-next') not in css
