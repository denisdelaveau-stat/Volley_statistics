from pathlib import Path
import re,sys
root=Path(sys.argv[1] if len(sys.argv)>1 else '.')
s=(root/'index.html').read_text(); sw=(root/'sw.js').read_text() if (root/'sw.js').exists() else ''
checks={
'30 jersey numbers':'for(var n=1;n<=30;n++)' in s,
'roster max 12':'var MAXP=12' in s,
'user guide button':'id="homeUserGuide"' in s,
'user guide opens PDF':"window.open('user_guide.pdf'" in s,
'PDF exists':(root/'user_guide.pdf').exists(),
'Focus court hidden normal':'#capturePanel:not(.sub-mode) .court-grid .touch.nofocus' in s,
'Focus bench hidden normal':'.bench-row .touch.nofocus' in s,
'Focus available substitution':'#capturePanel.sub-mode .court-grid .touch.nofocus' in s,
'large TEAM retained':'teamFocusBtn' in s,
'saved library retained':'volleyCapture.library.v1' in s,
'ROTATE +1 retained':'ROTATE +1' in s,
'version':'v1.5.3' in s,
'cache':'volley-live-capture-v1.5.3' in sw,
'PDF precache':'user_guide.pdf' in sw,
}
for n,v in checks.items():print(('PASS' if v else 'FAIL'),n)
print(sum(checks.values()),'/',len(checks));raise SystemExit(0 if all(checks.values()) else 1)
