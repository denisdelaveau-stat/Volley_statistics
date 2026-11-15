#!/usr/bin/env python3
from pathlib import Path
import re, shutil, sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.')
idx=root/'index.html'; here=Path(__file__).resolve().parent
if not idx.exists(): raise SystemExit('index.html not found')
s=idx.read_text(encoding='utf-8')
required=['id="homeScreen"','id="homeOpen"','volleyCapture.library.v1','ROTATE +1','teamFocusBtn','nofocus','var MAXP=12']
miss=[x for x in required if x not in s]
if miss: raise SystemExit('Expected v1.5.0 baseline not found: '+', '.join(miss))
if 'id="vlc-v153-release"' in s: raise SystemExit('v1.5.3 already installed')
# Jersey range: accept common spacing.
s,n=re.subn(r'for\s*\(\s*var\s+n\s*=\s*1\s*;\s*n\s*<=\s*20\s*;\s*n\+\+\s*\)', 'for(var n=1;n<=30;n++)', s, count=1)
if n!=1: raise SystemExit('Jersey-number 1..20 loop not found exactly once')
# USER GUIDE button after OPEN JSON.
pat=re.compile(r'(<button[^>]+id="homeOpen"[^>]*>.*?</button>)',re.S); m=pat.search(s)
if not m: raise SystemExit('homeOpen button not found')
btn='\n  <button type="button" class="home-btn home-guide" id="homeUserGuide" aria-label="Open user guide PDF">? USER GUIDE</button>'
s=s[:m.end()]+btn+s[m.end():]
css='''\n<style id="vlc-v153-release">\n.home-guide{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.75);min-height:66px}\n#capturePanel:not(.sub-mode) .court-grid .touch.nofocus,#capturePanel:not(.sub-mode) .bench-row .touch.nofocus{visibility:hidden!important;pointer-events:none!important}\n#capturePanel.sub-mode .court-grid .touch.nofocus,#capturePanel.sub-mode .bench-row .touch.nofocus{visibility:visible!important;pointer-events:auto!important}\n</style>\n'''
s=s.replace('</head>',css+'</head>',1)
js='''\n<script id="vlc-v153-guide-js">(function(){var b=document.getElementById('homeUserGuide');if(b)b.addEventListener('click',function(){window.open('user_guide.pdf','_blank','noopener')})})();</script>\n'''
s=s.replace('</body>',js+'</body>',1)
s=re.sub(r'(<div id="appVersion">)v1\.5\.\d+(</div>)',r'\1v1.5.3\2',s,count=1)
shutil.copy2(idx,root/'index_before_v1.5.3.html'); idx.write_text(s,encoding='utf-8')
for name in ['USER_GUIDE.md','user_guide.pdf']:
 shutil.copy2(here/name,root/name)
sw=root/'sw.js'
if sw.exists():
 t=sw.read_text(encoding='utf-8');t=re.sub(r'volley-live-capture-v1\.5\.\d+','volley-live-capture-v1.5.3',t)
 if 'user_guide.pdf' not in t:
  t=t.replace("'index.html'","'index.html','user_guide.pdf'",1) if "'index.html'" in t else t.replace('"index.html"','"index.html","user_guide.pdf"',1)
 sw.write_text(t,encoding='utf-8')
print('Volley Live Capture v1.5.3 installed')
