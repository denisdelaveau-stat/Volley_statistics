from pathlib import Path
r=Path(__file__).resolve().parents[1]; s=(r/'index.html').read_text(); sw=(r/'sw.js').read_text()
for token in ['v1.5.3','volleyCapture.library.v1','ROTATE +1','homeUserGuide','for(var n=1;n<=30;n++)','teamFocusBtn']:
 assert token in s, token
for f in ['manifest.webmanifest','user_guide.pdf','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png']:
 assert (r/f).exists(),f
assert 'volley-live-capture-v1.5.3' in sw
assert 'user_guide.pdf' in sw
print('PASS complete runtime/package checks')
