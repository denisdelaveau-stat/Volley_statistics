"""Volley Live Capture v1.2.0 - end-to-end test (Playwright, Chromium, iPhone 390x844 touch viewport).

Run:  pip install playwright && playwright install chromium
      python tests/test_e2e_pwa.py
Covers the v1.1.x behaviour at Advanced level and the v1.2.0 detail levels (L-01 ... L-14).
"""
import json, os, socket, subprocess, sys, time, tempfile
from playwright.sync_api import sync_playwright

VERSION = 'v1.3.2'
CACHE = 'volley-live-capture-' + VERSION
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8765
CHROME = os.environ.get('CHROME_PATH')  # optional: custom Chromium binary
TMP = tempfile.mkdtemp()

ok = True; n = 0
def chk(label, cond, extra=''):
    global ok, n
    n += 1; ok &= bool(cond)
    print(('PASS' if cond else 'FAIL'), label, extra)

ROSTER = {1: ('Martin', 'setter'), 2: ('Leroy', 'libero'), 3: ('Petit', 'mb'), 4: ('Garcia', 'mb'),
          5: ('Dubois', 'oh'), 6: ('Moreau', 'oh'), 7: ('Roux', 'opp'), 8: ('Blanc', 'oh')}

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
                       cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
for _ in range(50):
    try: socket.create_connection(('127.0.0.1', PORT), 0.2).close(); break
    except OSError: time.sleep(0.2)
URL = f'http://localhost:{PORT}/index.html'


def new_match(pg, level, name, fmt='2', first='service', nofocus=()):
    """Home -> NEW MATCH -> setup at the given level -> capture screen."""
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
    pg.tap('#homeNew'); pg.wait_for_selector('#suTeam')
    pg.fill('#suTeam', 'Antibes'); pg.fill('#suOpp', 'Nice'); pg.fill('#suName', name)
    pg.tap(f'[data-fmt="{fmt}"]')
    pg.select_option('#suLevel', level)
    if level == 'basic':
        pg.tap(f'[data-first="{first}"]'); pg.tap('#suNext')
    else:
        for k in ROSTER: pg.tap(f'[data-n="{k}"]')
        for k, (nm, ps) in ROSTER.items():
            pg.fill(f'[data-iname="{k}"]', nm); pg.tap(f'[data-ipos="{k}:{ps}"]')
        for k in nofocus: pg.uncheck(f'[data-ifocus="{k}"]')
        pg.tap('#suNext')
        for k in [5, 6, 3, 4, 1, 7, 2]: pg.tap(f'[data-pick="{k}"]')
        pg.tap('#suNext')
        for k in [7, 3, 5, 6, 4, 1]: pg.tap(f'[data-rpick="{k}"]')
        pg.tap(f'[data-first="{first}"]'); pg.tap('#suNext')
    pg.wait_for_selector('#courtStatus', state='attached'); pg.wait_for_load_state()


def events(pg):
    return pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]')")


def score(pg):
    return pg.inner_text('#liveScore').replace('\n', '').replace(' ', '')


def visible(pg, sel):
    return pg.eval_on_selector_all(sel, 'e=>e.filter(x=>x.offsetParent).map(x=>x.getAttribute("data-result")||x.getAttribute("data-player")||x.id)')


try:
    with sync_playwright() as p:
        b = p.chromium.launch(**({'executable_path': CHROME} if CHROME else {}))
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2,
                            is_mobile=True, has_touch=True, accept_downloads=True)
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('dialog', lambda d: d.accept())

        # ---------------- PWA ----------------
        pg.goto(URL); pg.wait_for_load_state('networkidle')
        man = pg.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
        chk('P1 manifest standalone + 2 icons', man['display'] == 'standalone' and len(man['icons']) == 2)
        chk('P2 version label ' + VERSION, pg.inner_text('#appVersion') == VERSION)
        chk('P3 service worker active', pg.evaluate("navigator.serviceWorker.ready.then(r=>!!r.active)"))
        pg.reload(); pg.wait_for_load_state('networkidle')
        keys = pg.evaluate("caches.keys()")
        cnt = pg.evaluate(f"caches.open('{CACHE}').then(c=>c.keys()).then(r=>r.length)")
        chk('P4 cache ' + CACHE + ' with 6 files', keys == [CACHE] and cnt == 6, f'{keys} {cnt}')
        srv.terminate(); srv.wait(); ctx.set_offline(True)
        pg.reload(); pg.wait_for_load_state()
        chk('P5 app starts offline', pg.is_visible('#homeNew'))

        # ---------------- L-01 / L-02 : setup list ----------------
        pg.tap('#homeNew'); pg.wait_for_selector('#suTeam')
        fmt_y = pg.locator('[data-fmt="3"]').bounding_box()['y']; sel = pg.locator('#suLevel').bounding_box()
        chk('L-01 Detail level list under the format, default Advanced',
            sel['y'] > fmt_y and pg.input_value('#suLevel') == 'advanced'
            and pg.eval_on_selector_all('#suLevel option', 'o=>o.map(x=>x.textContent)') == ['Basic', 'Intermediate', 'Advanced'])
        hints = []
        for lv in ['basic', 'intermediate', 'advanced']:
            pg.select_option('#suLevel', lv); hints.append(pg.inner_text('#suLevelHint'))
        chk('L-02 description changes with the level', len(set(hints)) == 3 and '2 taps' in hints[0] and '3 taps' in hints[2], str(hints))
        fs = pg.evaluate("parseFloat(getComputedStyle(document.getElementById('suLevel')).fontSize)")
        chk('L-02b select font >= 16 px (no iOS zoom)', fs >= 16, str(fs))
        pg.tap('#suBack')

        # ---------------- Advanced (v1.1.x behaviour) ----------------
        new_match(pg, 'advanced', 'Adv test')
        chk('A1 capture tools: only UNDO visible', visible(pg, '#capturePanel .capture-tools button') == ['captureUndo'])
        u = pg.locator('#captureUndo').bounding_box()
        chk('A2 UNDO centred', abs(u['x'] + u['width'] / 2 - 195) < 3)
        sj = pg.evaluate("document.getElementById('captureSaveJson').getBoundingClientRect().top+scrollY")
        st = pg.evaluate("document.getElementById('statsToggle').getBoundingClientRect().bottom+scrollY")
        chk('A3 SAVE/REPORT below STATISTICS', sj > st)
        col = pg.evaluate("getComputedStyle(document.querySelector('#liveScore .digit-box')).color")
        chk('A4 S-01 scoreboard white on black at 0:0 (tie)', col == 'rgb(255, 255, 255)', col)
        chk('A5 level chip ADVANCED in sets line', 'ADVANCED' in pg.inner_text('#setsLine'))
        chk('N-01 no role legend above NET', pg.locator('#capturePanel .role-legend').count() == 0)
        chk('N-02 badge SERVICE when own team serves', pg.inner_text('#phaseBadge') == 'SERVICE', pg.inner_text('#phaseBadge'))
        nb = pg.locator('#capturePanel .court-net').bounding_box(); bb = pg.locator('#phaseBadge').bounding_box()
        chk('N-03 badge directly above NET', 0 <= nb['y'] - (bb['y'] + bb['height']) < 20)
        pg.tap('#capturePanel .court-grid [data-player="5"]')
        order = pg.eval_on_selector_all('#actionList [data-action]', 'e=>e.filter(x=>!x.hidden).map(x=>x.dataset.action)')
        chk('A6 OH action order', order == ['reception', 'attack', 'defense', 'service', 'block', 'set'], str(order))
        pg.tap('[data-action=attack]')
        chk('A7 3 results offered', visible(pg, '[data-step=result] .touch') == ['neutral', 'point', 'error'])
        pg.tap('[data-result=neutral]')
        chk('A8 neutral keeps 0:0', score(pg) == '0:0', score(pg))
        pg.tap('#capturePanel [data-player="A"]')
        chk('A9 ADVERSE: one generic action',
            pg.eval_on_selector_all('#actionList [data-action]', 'e=>e.filter(x=>!x.hidden).map(x=>x.dataset.action)') == ['adverse'])
        pg.tap('[data-action=adverse]'); pg.tap('[data-result=point]')
        dc = lambda: pg.evaluate("[...document.querySelectorAll('#liveScore .digit-box')].map(d=>getComputedStyle(d).color)")
        chk('S-02 Team A behind (0:1): both digits red', dc() == ['rgb(255, 43, 43)'] * 2, str(dc()))
        chk('N-04 badge RECEPTION after opponent point', pg.inner_text('#phaseBadge') == 'RECEPTION', pg.inner_text('#phaseBadge'))
        p1_before = pg.get_attribute('#capturePanel .court-grid [data-zone="p1"]', 'data-player')
        pg.tap('#capturePanel .court-grid [data-player="7"]'); pg.tap('[data-action=attack]'); pg.tap('[data-result=point]')
        p1_after = pg.get_attribute('#capturePanel .court-grid [data-zone="p1"]', 'data-player')
        chk('N-05 badge back to SERVICE after side-out', pg.inner_text('#phaseBadge') == 'SERVICE')
        chk('S-03 tie (1:1): both digits white', dc() == ['rgb(255, 255, 255)'] * 2, str(dc()))
        chk('A10 side-out rotates the court', p1_before != p1_after and score(pg) == '1:1', f'{p1_before}->{p1_after} {score(pg)}')
        pg.tap('#captureUndo')
        chk('A11 UNDO removes last event', len(events(pg)) == 2 and score(pg) == '0:1', score(pg))
        pg.tap('#subToggle'); pg.tap('#capturePanel .court-grid [data-player="6"]'); pg.tap('.sub-sheet [data-in="8"]')
        chk('A12 substitution #8 for #6', '#8 for #6' in pg.inner_text('#subLog'))
        with pg.expect_download() as d: pg.tap('#captureSaveJson')
        chk('A13 SAVE .JSON named after match', d.value.suggested_filename == 'Adv_test.json')
        chk('A14 file message only at the bottom', 'Saved file' in pg.inner_text('#fileStatus') and 'Saved file' not in pg.inner_text('#captureStatus'))

        # ---------------- Basic ----------------
        pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
        pg.tap('#homeNew'); pg.wait_for_selector('#suTeam'); pg.select_option('#suLevel', 'basic')
        chk('L-03 Basic: no roster, first rally on SETUP 1, START SET 1',
            pg.locator('[data-n="1"]').count() == 0 and pg.locator('[data-first]').count() == 2
            and pg.inner_text('#suNext') == 'START SET 1' and pg.is_hidden('#suS2'))
        pg.tap('#suBack')
        new_match(pg, 'basic', 'Basic test', first='service')
        chk('L-04a Basic step 1: two team buttons only',
            visible(pg, '#capturePanel [data-step=player] [data-player]') == ['T', 'A']
            and pg.locator('#capturePanel .court-grid').count() == 0)
        pg.tap('#capturePanel [data-player="T"]')
        chk('L-04b Basic step 2: Point and Error only', visible(pg, '[data-step=result] .touch') == ['point', 'error'])
        chk('L-04c step titles 1. Team / 2. Result',
            pg.inner_text('[data-step=player] .step-title') == '1. Team' and pg.inner_text('[data-step=result] .step-title') == '2. Result')
        pg.tap('[data-result=point]')
        pg.tap('#capturePanel [data-player="T"]'); pg.tap('[data-result=error]')
        ev = events(pg)
        chk('L-05 Basic scoring: own point A+1 earned, own error B+1 opponent_error, player T',
            score(pg) == '1:1' and ev[0]['player'] == 'T' and ev[0]['action'] == 'team' and ev[0]['pointOrigin'] == 'earned'
            and ev[1]['winningTeam'] == 'team2' and ev[1]['pointOrigin'] == 'opponent_error', score(pg))
        chk('L-06 Basic: serving line follows the winner, no SUBSTITUTION',
            'Nice serves' in pg.inner_text('#courtStatus') and pg.locator('#subToggle').count() == 0, pg.inner_text('#courtStatus'))
        pg.tap('#capturePanel [data-player="A"]'); pg.tap('[data-result=error]')
        chk('S-04 Team A ahead (2:1): both digits green',
            pg.evaluate("[...document.querySelectorAll('#liveScore .digit-box')].map(d=>getComputedStyle(d).color)") == ['rgb(34, 224, 90)'] * 2)
        chk('L-06b ADVERSE error gives A+1, Antibes serves', score(pg) == '2:1' and 'Antibes serves' in pg.inner_text('#courtStatus'))
        chk('L-11a level chip BASIC', 'BASIC' in pg.inner_text('#setsLine'))
        pg.tap('#statsToggle')
        chk('L-13a Basic: attackers hidden', pg.is_hidden('#attSection') and pg.locator('h2', has_text='All attackers').count() == 0)
        pg.tap('#statsToggle')
        while not pg.is_visible('#setOver'):
            pg.tap('#capturePanel [data-player="T"]'); pg.tap('[data-result=point]')
        chk('L-14a Basic: set 1 won at 25', 'SET 1 FINISHED' in pg.inner_text('#setOverTitle') and score(pg) == '25:1', score(pg))
        with pg.expect_download() as d: pg.tap('#captureReport')
        rp = os.path.join(TMP, 'basic_report.html'); d.value.save_as(rp); txt = open(rp, encoding='utf-8').read()
        chk('L-13b Basic report: points per team, no players table', 'Points per team' in txt and 'Players (' not in txt and 'detail level: basic' in txt)
        with pg.expect_download() as d: pg.tap('#captureSaveJson')
        bj = os.path.join(TMP, 'basic.json'); d.value.save_as(bj)
        pg.reload(); pg.wait_for_load_state()
        chk('L-11b HOME shows level after reload', 'Basic' in pg.inner_text('#homeLast'), pg.inner_text('#homeLast'))
        pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
        pg.set_input_files('#homeFile', bj); pg.wait_for_timeout(600)
        chk('L-11c OPEN .JSON keeps Basic', 'BASIC' in pg.inner_text('#setsLine') and pg.locator('#capturePanel [data-player="T"]').count() == 1)

        # ---------------- Intermediate ----------------
        new_match(pg, 'intermediate', 'Inter test', first='reception')
        chk('L-07a Intermediate: court shown', pg.locator('#capturePanel .court-grid [data-zone]').count() == 6)
        pg.tap('#capturePanel .court-grid [data-player="5"]')
        chk('L-07b after player tap: Point / Error only, no action step',
            pg.is_visible('[data-step=result]') and not pg.is_visible('[data-step=action]')
            and visible(pg, '[data-step=result] .touch') == ['point', 'error'])
        p1_before = pg.get_attribute('#capturePanel .court-grid [data-zone="p1"]', 'data-player')
        pg.tap('[data-result=point]')
        ev = events(pg); p1_after = pg.get_attribute('#capturePanel .court-grid [data-zone="p1"]', 'data-player')
        chk('L-08 event action generic; side-out rotates', ev[-1]['action'] == 'generic' and ev[-1]['player'] == 5 and p1_before != p1_after,
            f"{ev[-1]['action']} {p1_before}->{p1_after}")
        pg.tap('#capturePanel .court-grid [data-player="7"]'); pg.tap('#captureBack')
        chk('L-07c CHANGE returns to player step', pg.is_visible('[data-step=player]') and len(events(pg)) == 1)
        pg.tap('#subToggle'); pg.tap('#capturePanel .court-grid [data-player="6"]'); pg.tap('.sub-sheet [data-in="8"]')
        chk('L-09 Intermediate substitution', '#8 for #6' in pg.inner_text('#subLog'))
        pg.tap('#capturePanel .court-grid [data-player="8"]'); pg.tap('[data-result=error]')
        pg.tap('#statsToggle')
        card = pg.inner_text('#attSection')
        chk('L-13c Intermediate attackers: no Neu, "No action detail" row', 'Neu' not in card and 'No action detail' in card)
        pg.tap('#statsToggle')
        while not pg.is_visible('#setOver'):
            pg.tap('#capturePanel [data-player="A"]'); pg.tap('[data-result=error]')
        pg.tap('#nextSetBtn'); pg.wait_for_load_state()
        while not pg.is_visible('#setOver'):
            pg.tap('#capturePanel [data-player="A"]'); pg.tap('[data-result=error]')
        chk('L-14b Intermediate: match won 2-0', 'MATCH WON' in pg.inner_text('#setOverTitle'), pg.inner_text('#setOverTitle'))
        with pg.expect_download() as d: pg.tap('#reportBtn2')
        rp = os.path.join(TMP, 'inter_report.html'); d.value.save_as(rp); txt = open(rp, encoding='utf-8').read()
        chk('L-13d Intermediate report: Pts / Err / Diff players table', 'Players (points / errors)' in txt and 'detail level: intermediate' in txt)

        # ---------------- L-12 old file ----------------
        # build a v1.1.x-style match (no detailLevel) from the Intermediate run
        m = pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))"); m.pop('detailLevel', None)
        oj = os.path.join(TMP, 'old.json'); json.dump({'format': 'volley-live-capture', 'version': 1, 'match': m, 'events': [], 'chartData': []}, open(oj, 'w'))
        pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
        pg.set_input_files('#homeFile', oj); pg.wait_for_timeout(600)
        chk('L-12 v1.1.x file without detailLevel opens as Advanced', 'ADVANCED' in pg.inner_text('#setsLine'))

        # ---------------- F: Focus (v1.3.0) ----------------
        pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
        pg.tap('#homeNew'); pg.wait_for_selector('#suTeam')
        pg.select_option('#suLevel', 'advanced')
        for k in ROSTER: pg.tap(f'[data-n="{k}"]')
        boxes = pg.eval_on_selector_all('[data-ifocus]', 'e=>e.map(x=>x.checked)')
        chk('F-01 one Focus checkbox per player, checked by default', len(boxes) == len(ROSTER) and all(boxes), str(boxes))
        # rotation used by new_match: P4=7 P3=3 P2=5 P5=6 P6=4 P1=1, libero 2 (replaces 4 in P6)
        new_match(pg, 'advanced', 'Focus adv', nofocus=(3, 6))
        mm = pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
        fl = {r['number']: r['focus'] for r in mm['team']['roster']}
        chk('F-02 focus stored in roster', fl[3] is False and fl[6] is False and fl[5] is True, str(fl))
        court = pg.eval_on_selector_all('.court-grid [data-zone]', 'e=>e.map(x=>(x.classList.contains("nofocus")?"T":x.dataset.player))')
        chk('F-03 Advanced: non-focus players not proposed (shown as TEAM)', court.count('T') == 2 and '3' not in court and '6' not in court, str(court))
        chk('F-04 TEAM button visible', pg.is_visible('#teamFocusBtn'))
        pg.tap('.court-grid .nofocus', force=True) if False else None
        pg.evaluate("document.querySelector('.court-grid .nofocus').click()")
        chk('F-05 tap on a non-focus cell does nothing', pg.evaluate("document.querySelector('.step.active').dataset.step") == 'player' and len(events(pg)) == 0)
        pg.tap('#teamFocusBtn')
        acts = pg.eval_on_selector_all('#actionList [data-action]:not([hidden])', 'e=>e.map(x=>x.dataset.action)')
        chk('F-06 Advanced TEAM -> 6 actions', len(acts) == 6, str(acts))
        pg.tap('[data-action=attack]'); pg.tap('[data-result=point]')
        ev = events(pg)[-1]
        chk('F-07 TEAM point recorded as player "T", own team scores', ev['player'] == 'T' and ev['winningTeam'] == 'team1' and ev['pointOrigin'] == 'earned', str(ev))
        pg.tap('#teamFocusBtn'); pg.tap('[data-action=reception]'); pg.tap('[data-result=error]')
        ev = events(pg)[-1]
        chk('F-08 TEAM error gives the point to the opponent', ev['player'] == 'T' and ev['winningTeam'] == 'team2', str(ev))
        pg.tap('#capturePanel .court-grid [data-player="5"]'); pg.tap('[data-action=attack]'); pg.tap('[data-result=point]')
        chk('F-09 focus player still selectable', events(pg)[-1]['player'] == 5)
        # substitution of a non-focus player is still possible
        pg.tap('#subToggle'); pg.evaluate("document.querySelector('.court-grid [data-player=\"6\"]').click()")
        pg.tap('[data-in="8"]')
        court = pg.eval_on_selector_all('.court-grid [data-zone]', 'e=>e.map(x=>(x.classList.contains("nofocus")?"T":x.dataset.player))')
        chk('F-10 substitution of a non-focus player; focus player #8 now proposed', '8' in court and court.count('T') == 1, str(court))
        pg.tap('#statsToggle'); pg.wait_for_timeout(200); pg.tap('#statsToggle')
        with pg.expect_download() as d: pg.tap('#captureReport')
        rp = os.path.join(TMP, 'focus_report.html'); d.value.save_as(rp); txt = open(rp, encoding='utf-8').read()
        chk('F-11 report has a TEAM row', 'TEAM (players without focus)' in txt)
        # Intermediate
        new_match(pg, 'intermediate', 'Focus inter', nofocus=(5,))
        court = pg.eval_on_selector_all('.court-grid [data-zone]', 'e=>e.map(x=>(x.classList.contains("nofocus")?"T":x.dataset.player))')
        chk('F-12 Intermediate: #5 not proposed, TEAM visible', '5' not in court and pg.is_visible('#teamFocusBtn'), str(court))
        pg.tap('#teamFocusBtn')
        chk('F-13 Intermediate TEAM -> Point / Error directly', pg.evaluate("document.querySelector('.step.active').dataset.step") == 'result')
        pg.tap('[data-result=point]')
        ev = events(pg)[-1]
        chk('F-14 Intermediate TEAM event (T, generic)', ev['player'] == 'T' and ev['action'] == 'generic' and ev['winningTeam'] == 'team1', str(ev))
        # all focus -> no TEAM button
        new_match(pg, 'advanced', 'Focus all')
        chk('F-15 all players with focus -> no TEAM button', not pg.is_visible('#teamFocusBtn'))
        # old file without focus field -> everybody focus
        m = pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
        for r in m['team']['roster']: r.pop('focus', None)
        oj = os.path.join(TMP, 'nofocusfield.json'); json.dump({'format': 'volley-live-capture', 'version': 1, 'match': m, 'events': [], 'chartData': []}, open(oj, 'w'))
        pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
        pg.set_input_files('#homeFile', oj); pg.wait_for_timeout(600)
        chk('F-16 file without "focus" (v1.2.0) -> all players proposed', pg.locator('.court-grid .nofocus').count() == 0 and not pg.is_visible('#teamFocusBtn'))
        pg.screenshot(path=os.path.join(TMP, 'focus.png'))

        chk('E no JavaScript error', not errs, str(errs[:3]))
        b.close()
finally:
    try: srv.terminate()
    except Exception: pass
print(f'{n} checks -> ' + ('ALL PASSED' if ok else 'SOME FAILED'))
sys.exit(0 if ok else 1)
