from playwright.sync_api import sync_playwright
import copy
exec(open('/home/claude/build/edge.py').read().split('with sync_playwright')[0])
R=[]
def ck(n,c):R.append(c);print(('PASS ' if c else 'FAIL ')+n)
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
  mm=copy.deepcopy(m);mm['detailLevel']='basic'
  pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('file:///home/claude/v150/index.html')
  pg.evaluate("m=>{localStorage.clear();localStorage.setItem('volleyCapture.match.v1',JSON.stringify(m));sessionStorage.setItem('volleyCapture.stage','capture')}",mm);pg.reload();pg.wait_for_timeout(400)
  pg.screenshot(path='basic.png')
  E=lambda:pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]')")
  S=lambda:pg.inner_text('#liveScore').replace('\n','')
  ck('2 boutons uniques',pg.locator('.bq-split').count()==2 and pg.locator('.bq-btn').count()==0)
  ya=pg.locator('[data-q="T"]').bounding_box()['y'];yn=pg.locator('.bq-net').bounding_box()['y'];yb=pg.locator('[data-q="A"]').bounding_box()['y']
  ck('Antibes en haut, NET au milieu, Nice en bas',ya<yn<yb)
  def tap(q,f):
    bb=pg.locator('[data-q="%s"]'%q).bounding_box();pg.mouse.click(bb['x']+bb['width']*f,bb['y']+bb['height']/2);pg.wait_for_timeout(450);return E()[-1]
  e=tap('T',.85);ck('Antibes droite O -> T point (%s)'%S(),e['player']=='T' and e['result']=='point')
  e=tap('T',.15);ck('Antibes gauche X -> T error (%s)'%S(),e['player']=='T' and e['result']=='error')
  e=tap('A',.85);ck('Nice droite O -> A point (%s)'%S(),e['player']=='A' and e['result']=='point')
  e=tap('A',.15);ck('Nice gauche X -> A error (%s)'%S(),e['player']=='A' and e['result']=='error')
  n=len(E());bb=pg.locator('[data-q="T"]').bounding_box();x=bb['x']+bb['width']*.85;y=bb['y']+bb['height']/2
  pg.mouse.click(x,y);pg.mouse.click(x,y);pg.wait_for_timeout(450);ck('double tap rapide -> 1 event',len(E())-n==1)
  pg.locator('#captureUndo').click();pg.wait_for_timeout(450);ck('UNDO',len(E())==n)
  ck('aucune erreur JS',not errs)
  b.close()
print(sum(R),'/',len(R))
