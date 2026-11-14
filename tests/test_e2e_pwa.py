import json,subprocess,time,sys
from playwright.sync_api import sync_playwright
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=8765
srv=subprocess.Popen([sys.executable,'-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
URL=f'http://localhost:{PORT}/index.html'
ok=True;n=0
def chk(l,c,e=''):
    global ok,n; n+=1; ok&=bool(c); print(('PASS' if c else 'FAIL'),l,e)
roster={1:('Martin','setter'),2:('Leroy','libero'),3:('Petit','mb'),4:('Garcia','mb'),5:('Dubois','oh'),6:('Moreau','oh'),7:('Roux','opp'),8:('Blanc','oh')}
try:
  with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-current/chrome-linux64/chrome')
    ctx=b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,accept_downloads=True)
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('dialog',lambda d:d.accept())
    pg.goto(URL); pg.wait_for_load_state('networkidle')
    man=pg.evaluate("fetch('manifest.webmanifest').then(r=>r.json())")
    chk('P1 manifest standalone + 2 icons',man['display']=='standalone' and len(man['icons'])==2)
    chk('P2 icons served',all(pg.evaluate(f"fetch('{i}').then(r=>r.ok)") for i in ['icons/apple-touch-icon.png','icons/icon-192.png','icons/icon-512.png']))
    chk('P3 version label v1.1.3',pg.inner_text('#appVersion')=='v1.1.3')
    chk('P4 service worker active',pg.evaluate("navigator.serviceWorker.ready.then(r=>!!r.active)"))
    pg.reload(); pg.wait_for_load_state('networkidle')
    chk('P5 page controlled by SW',pg.evaluate("!!navigator.serviceWorker.controller"))
    keys=pg.evaluate("caches.keys()")
    cached=pg.evaluate("caches.open('volley-live-capture-v1.1.3').then(c=>c.keys()).then(r=>r.length)")
    chk('P6 cache v1.1.3 with 6 files',keys==['volley-live-capture-v1.1.3'] and cached==6,str(keys))
    srv.terminate(); srv.wait(); ctx.set_offline(True)
    pg.reload(); pg.wait_for_load_state()
    chk('O1 app starts offline',pg.is_visible('#homeNew'))
    pg.tap('#homeNew'); pg.wait_for_selector('#suTeam',timeout=8000)
    chk('O2 setup offline',pg.is_visible('#setupScreen'))
    pg.fill('#suTeam','Antibes'); pg.fill('#suOpp','Nice'); pg.fill('#suName','Test offline')
    pg.tap('[data-fmt="2"]')
    for k in range(1,9): pg.tap(f'[data-n="{k}"]')
    for k,(nm,ps) in roster.items(): pg.fill(f'[data-iname="{k}"]',nm); pg.tap(f'[data-ipos="{k}:{ps}"]')
    pg.tap('#suNext')
    for k in [5,6,3,4,1,7,2]: pg.tap(f'[data-pick="{k}"]')
    pg.tap('#suNext')
    for k in [7,3,5,6,4,1]: pg.tap(f'[data-rpick="{k}"]')
    pg.tap('[data-first="service"]'); pg.tap('#suNext'); pg.wait_for_selector('#courtStatus',state='attached'); pg.wait_for_load_state()
    chk('O3 capture offline','Set 1' in pg.inner_text('#captureTitle'))
    def rally(pl,a,r):
        pg.tap(f'#capturePanel [data-player="{pl}"]'); pg.tap('[data-action=adverse]' if pl=='A' else f'[data-action={a}]'); pg.tap(f'[data-result={r}]')
    pg.tap('#subToggle'); pg.tap('#capturePanel .court-grid [data-player="5"]'); pg.tap('[data-in="8"]')
    chk('S1 substitution #8 for #5',pg.locator('#capturePanel .court-grid [data-player="8"]').count()==1 and pg.locator('#capturePanel .court-grid [data-player="5"]').count()==0)
    for i in range(20): rally('A','adverse','point') if i%2 else rally('7','attack','point')
    while not pg.is_visible('#setOver'): rally('A','adverse','error')
    chk('T1 set 1 finished',pg.is_visible('#setOver'),pg.inner_text('#liveScore'))
    pg.tap('#nextSetBtn'); pg.wait_for_load_state(); pg.wait_for_selector('#courtStatus',state='attached')
    chk('T2 set 2 at 0:0','Set 2' in pg.inner_text('#captureTitle') and pg.inner_text('#liveScore').replace('\n','').replace(' ','')=='0:0')
    chk('T3 set 2 first serve alternates','receives' in pg.evaluate("document.getElementById('courtStatus').textContent"))
    while not pg.is_visible('#setOver'): rally('A','adverse','error')
    chk('T4 match won, SAVE MATCH .JSON','MATCH WON' in pg.inner_text('#setOverTitle') and pg.inner_text('#nextSetBtn')=='SAVE MATCH .JSON')
    with pg.expect_download() as dl: pg.tap('#nextSetBtn')
    d=dl.value; d.save_as('m.json'); j=json.load(open('m.json'))
    chk('F1 JSON named after match, completed',d.suggested_filename=='Test_offline.json' and j['match']['status']=='completed',d.suggested_filename)
    chk('F2 JSON has substitution',len(j['match'].get('subs',[]))==1)
    if pg.is_visible('#captureReport'):
        with pg.expect_download() as dl2: pg.tap('#captureReport')
        r=dl2.value; r.save_as('rep.html'); txt=open('rep.html',encoding='utf-8').read()
        chk('F3 REPORT .HTML offline',r.suggested_filename.endswith('.html') and 'Antibes' in txt and len(txt)>2000,r.suggested_filename)
    else:
        chk('F3 REPORT button visible',False)
    pg.reload(); pg.wait_for_load_state()
    chk('R1 restart offline keeps match','Test offline' in pg.inner_text('#homeLast'),pg.inner_text('#homeLast'))
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_load_state()
    pg.set_input_files('#homeFile','m.json'); pg.wait_for_timeout(600)
    chk('R2 OPEN .JSON offline restores match','Antibes vs Nice' in pg.inner_text('#captureTitle'))
    col=pg.evaluate("(()=>{var d=document.querySelector('#liveScore .digit-box');return d?getComputedStyle(d).color:''})()")
    chk('V1 scoreboard digits red on black',col=='rgb(255, 43, 43)',col)
    lw=pg.evaluate("(()=>{var c=document.createElement('div');c.className='card';c.innerHTML='<div class=legend><span><svg width=34 height=10></svg> Player 5</span></div>';document.body.appendChild(c);var w=c.querySelector('svg').getBoundingClientRect().width;c.remove();return w})()")
    chk('V2 legend swatches 34 px (names visible)',lw<=40,str(lw))
    chk('E no JS errors',not errs,str(errs[:3]))
    b.close()
finally:
  try: srv.terminate()
  except: pass
print(f'{n} checks -> '+('ALL PASSED' if ok else 'SOME FAILED'))
