from playwright.sync_api import sync_playwright
import json,sys
R=[]
def ck(n,c):R.append(c);print(('PASS ' if c else 'FAIL ')+n)
URL='file:///home/claude/v150/index.html'
with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
  pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('dialog',lambda d:d.accept())
  pg.goto(URL);pg.evaluate('localStorage.clear()');pg.reload();pg.click('#homeNew');pg.wait_for_timeout(300)
  ck('version v1.5.0',pg.evaluate("document.getElementById('appVersion').textContent")=='v1.5.0')
  ck('etape 1: carte Saved teams',pg.locator('.su-lib').count()==1 and 'Saved teams' in pg.inner_text('.su-lib'))
  pg.fill('#suTeam','Antibes');pg.fill('#suOpp','Nice')
  roster={1:('Lea','setter'),2:('Mia','libero'),3:('Zoe','oh'),4:('Ana','mb'),5:('Eva','oh'),6:('Ines','mb'),7:('Lou','opp'),8:('Jade','oh')}
  for n in roster:pg.click('[data-n="%d"]'%n)
  for n,(nm,pos) in roster.items():pg.fill('[data-iname="%d"]'%n,nm);pg.click('[data-ipos="%d:%s"]'%(n,pos))
  pg.uncheck('[data-ifocus="8"]')
  pg.fill('[data-libname="team"]','Antibes U18');pg.click('[data-libsave="team"]')
  lib=pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")
  t=lib['team'].get('Antibes U18',{})
  ck('equipe sauvegardee (8 joueurs, noms, postes, focus)',t.get('roster')==list(roster) and t['info']['3']['name']=='Zoe' and t['info']['4']['pos']=='mb' and t['info']['8']['focus']==False)
  ck('message Saved',pg.inner_text('#suMsg').startswith('Saved'))
  # modifier : change name of 3, add 9, save same name
  pg.fill('[data-iname="3"]','Zoé M.');pg.click('[data-n="9"]');pg.fill('[data-iname="9"]','Lily');pg.click('[data-ipos="9:mb"]')
  pg.click('[data-libsave="team"]')
  t=pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")['team']['Antibes U18']
  ck('modification: meme nom ecrase (9 joueurs, #3 renomme)',len(t['roster'])==9 and t['info']['3']['name']=='Zoé M.' and pg.inner_text('#suMsg').startswith('Updated'))
  # reload page, new match, load team
  pg.reload();pg.click('#homeNew');pg.wait_for_timeout(200)
  pg.select_option('#libSel_team','Antibes U18');pg.click('[data-libload="team"]')
  ck('rechargement equipe: nom, 9 joueurs, noms, focus',pg.input_value('#suTeam')=='Antibes' and pg.locator('.su-nums .sel').count()==9 and pg.input_value('[data-iname="3"]')=='Zoé M.' and not pg.is_checked('[data-ifocus="8"]'))
  pg.fill('#suOpp','Nice');pg.click('#suNext');pg.wait_for_timeout(200)
  # step2
  ck('etape 2: carte Saved starting 7',pg.locator('.su-lib').count()==1 and 'Saved starting 7' in pg.inner_text('.su-lib'))
  for slot,n in [('oh1',3),('oh2',5),('mb1',4),('mb2',6),('setter',1),('opp',7),('libero',2)]:pg.click('[data-slot="%s"]'%slot);pg.click('[data-pick="%d"]'%n)
  pg.fill('[data-libname="lineup"]','Standard');pg.click('[data-libsave="lineup"]')
  # modify: mb2 -> 9 and save
  pg.click('[data-slot="mb2"]');pg.click('[data-pick="9"]');pg.click('[data-libsave="lineup"]')
  lu=pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")['lineup']['Standard']['lineup']
  ck('7 sauvegarde puis modifie (mb2=9)',lu=={'oh1':3,'oh2':5,'mb1':4,'mb2':9,'setter':1,'opp':7,'libero':2})
  # clear slots then load
  for slot in ['oh1','mb2']:pg.click('[data-slot="%s"]'%slot)
  pg.select_option('#libSel_lineup','Standard');pg.click('[data-libload="lineup"]')
  ck('rechargement du 7',pg.locator('.su-slots .su-slot.sel').count()==7 and not pg.locator('#suNext').is_disabled())
  pg.click('#suNext');pg.wait_for_timeout(200)
  # step3
  ck('etape 3: carte Saved rotations + ROTATE +1',pg.locator('.su-lib').count()==1 and pg.locator('#suRotate').count()==1)
  ROT={'p1':1,'p2':3,'p3':4,'p4':7,'p5':5,'p6':9}
  for k in ['p4','p3','p2','p5','p6','p1']:pg.click('[data-pos="%s"]'%k);pg.click('[data-rpick="%d"]'%ROT[k])
  pg.fill('[data-libname="rot"]','Setter P1');pg.click('[data-libsave="rot"]')
  pg.click('#suRotate')
  r=pg.evaluate("window.__S.rot")
  exp={'p1':3,'p6':1,'p5':9,'p4':5,'p3':7,'p2':4}
  ck('ROTATE +1: P2->P1, P1->P6, P6->P5, P5->P4, P4->P3, P3->P2 %s'%r,r==exp)
  for i in range(5):pg.click('#suRotate')
  ck('6 rotations = position de depart',pg.evaluate("window.__S.rot")==ROT)
  pg.click('#suRotate');pg.fill('[data-libname="rot"]','Setter P6');pg.click('[data-libsave="rot"]')
  lib=pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")
  ck('2 rotations sauvegardees',sorted(lib['rot'])==['Setter P1','Setter P6'] and lib['rot']['Setter P6']['rot']==exp)
  pg.select_option('#libSel_rot','Setter P1');pg.click('[data-libload="rot"]')
  ck('rechargement rotation Setter P1',pg.evaluate("window.__S.rot")==ROT)
  pg.select_option('#libSel_rot','Setter P6');pg.click('[data-libdel="rot"]')
  ck('suppression rotation',list(pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")['rot'])==['Setter P1'])
  pg.screenshot(path='step3.png',full_page=True)
  pg.click('[data-first="service"]');pg.click('#suNext');pg.wait_for_load_state();pg.wait_for_timeout(400)
  m=pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.match.v1'))")
  ck('match cree avec la composition rechargee',m['startingRotation']==ROT and m['startingLineup']['middle2' if False else 'mb2']==9 and len(m['team']['roster'])==9)
  ck('bibliotheque conservee apres creation du match','Antibes U18' in pg.evaluate("JSON.parse(localStorage.getItem('volleyCapture.library.v1'))")['team'])
  # missing player when loading lineup with smaller team
  pg.evaluate("localStorage.removeItem('volleyCapture.match.v1')");pg.reload();pg.click('#homeNew');pg.wait_for_timeout(200)
  for n in [1,2,3,4,5,6,7]:pg.click('[data-n="%d"]'%n)
  pg.click('#suNext');pg.select_option('#libSel_lineup','Standard');pg.click('[data-libload="lineup"]')
  ck('joueur absent (#9) signale, poste laisse vide',"#9" in pg.inner_text('#suMsg') and pg.locator('.su-slots .su-slot.sel').count()==6)
  ck('aucune erreur JS',not errs)
  b.close()
print(sum(R),'/',len(R))
