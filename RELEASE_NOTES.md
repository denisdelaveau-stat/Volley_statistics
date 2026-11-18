# Volley Live Capture v1.6.10 — Release Notes

## Corrected PWA artwork
All application icon outputs now come from the supplied high-resolution `IMG_5596.PNG`, with the source's pale perimeter and white rounded-corner area removed. The corrected files are full-square, fully opaque PNGs with a navy background extending to each edge. No rounded corner is pre-rendered; iOS applies its own Home-screen mask.

Updated outputs:
- `icons/apple-touch-icon.png` — 180 × 180
- `icons/favicon-32.png` — 32 × 32
- `icons/icon-192.png` — 192 × 192
- `icons/icon-512.png` — 512 × 512
- `icons/icon-master-v1.6.10.png` — corrected 1254 × 1254 master

## Preserved v1.6.9 behaviour
The equal 5 px score spacing, contained 28 px net posts, Intermediate/Advanced BENCH divider, scoring logic, substitutions and format-version-1 match compatibility are unchanged.

The service-worker cache is now `volley-live-capture-v1.6.10`. On iPhone, remove and re-add the Home-screen shortcut if the old icon remains cached.
