from playwright.sync_api import sync_playwright
import json,copy
exec(open('/home/claude/build/edge.py').read().split('with sync_playwright')[0])
R=[]
def ck(n,c):R.append((n,c));print(('PASS ' if c else 'FAIL ')+n)
def page(b,lvl):
  mm=copy.deepcopy(m);mm['detailLevel']=lvl
  pg=b.new_page(viewport={'width':390,'height':844});pg.goto('file:///home/claude/v150/index.html')
  pg.evaluate("m=>{localStorage.clear();localStorage.setItem('volleyCapture.match.v1',JSON.stringify(m));sessionStorage.setItem('volleyCapture.stage','capture')}",mm);pg.reload();pg.wait_for_timeout(300)
  return pg
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
  # Intermediate
  pg=page(b,'intermediate');E=lambda:len(pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]')"))
  ck('version v1.5.0',pg.locator('#appVersion').inner_text()=='v1.5.0')
  bb=pg.locator('.court-grid [data-zone="p2"]').bounding_box();x=bb['x']+bb['width']*.8;y=bb['y']+bb['height']/2
  pg.mouse.click(x,y);pg.mouse.click(x,y);ck('INTER double tap rapide -> 1 event',E()==1)
  pg.wait_for_timeout(450);pg.mouse.click(x,y);pg.wait_for_timeout(150);pg.mouse.click(x,y);ck('INTER 2 taps a 150 ms -> +1 event',E()==2)
  pg.wait_for_timeout(450);pg.mouse.click(x,y);ck('INTER tap apres 450 ms -> accepte',E()==3)
  pg.wait_for_timeout(450);pg.locator('#captureUndo').click();pg.locator('#captureUndo').click();ck('UNDO double tap -> 1 seul undo',E()==2)
  pg.wait_for_timeout(450);pg.locator('#captureUndo').click();ck('UNDO apres 450 ms -> accepte',E()==1)
  pg.close()
  # Basic
  pg=page(b,'basic');E=lambda:len(pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]')"))
  bt=pg.locator('[data-q="T"]');bt.click();bt.click();ck('BASIC double tap POINT -> 1 event',E()==1)
  pg.wait_for_timeout(450);pg.locator('[data-q="A"]').click(position={'x':10,'y':20});ck('BASIC tap suivant apres 450 ms',E()==2)
  pg.close()
  # Advanced
  pg=page(b,'advanced');E=lambda:pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.events.v1')||'[]')")
  step=lambda:pg.evaluate("document.querySelector('#capturePanel .step.active').getAttribute('data-step')")
  pl=pg.locator('.court-grid [data-zone="p2"]');bb=pl.bounding_box();x=bb['x']+bb['width']/2;y=bb['y']+bb['height']/2;pg.mouse.click(x,y);pg.mouse.click(x,y)
  ck('ADV double tap joueur -> reste etape Action',step()=='action')
  pg.wait_for_timeout(450);pg.locator('[data-action]:visible').first.click();pg.wait_for_timeout(450)
  bb=pg.locator('[data-result="point"]').bounding_box();x2=bb['x']+bb['width']/2;y2=bb['y']+bb['height']/2;pg.mouse.click(x2,y2);pg.mouse.click(x2,y2);ck('ADV double tap Point -> 1 event',len(E())==1)
  pg.wait_for_timeout(450)
  pl.click();pg.wait_for_timeout(450);pg.locator('[data-action]:visible').first.click();pg.wait_for_timeout(450);pg.locator('[data-result="error"]').click()
  ck('ADV saisie normale 3 taps -> 2 events',len(E())==2 and E()[-1]['result']=='error')
  pg.close();b.close()
print(sum(c for _,c in R),'/',len(R))
