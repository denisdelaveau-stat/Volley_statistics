# SYS-PWA — Offline application, installation and updates

| Field | Value |
|---|---|
| Spec ID | `SYS-PWA` |
| Status | Current |
| Version | 1.0 |
| Applies to | VolleyLive v1.28.0 |
| Last review | 2026-11-27 |
| Source of truth | `sw.js`, `manifest.webmanifest`, `js/index-pwa.js`, `icons/`, `VERSION`, `tools/bump_version.py` |
| Related specs | SYS-ARCH (files), SYS-DATA (storage durability), UI-HOME (install hint), SYS-DESIGN (icons) |

## 1. Purpose

Defines how VolleyLive works without network once loaded, how it is installed on a phone or tablet Home screen, and
how an installed copy receives a new version.

## 2. Scope

- In scope: service worker cache, web app manifest, icons, install hint, persistent storage, update rule.
- Out of scope: what the application stores (SYS-DATA).

## 3. Definitions

- App shell: the files needed to run the application (`ASSETS` in `sw.js`).
- Installed copy: the application added to the Home screen (standalone display).

## 4. Requirements

| ID | Requirement | Rule / source |
|---|---|---|
| `SYS-PWA-01` | Served over HTTPS (or `localhost`), the application registers a service worker (`sw.js`) that stores the app shell in a cache named `volley-live-capture-v<VERSION>`. Opened from `file://`, it runs without service worker. | Offline use |
| `SYS-PWA-02` | The app shell list contains every page, script, stylesheet, icon and reference file the application loads; a new file is added to `ASSETS` in the same change. | Offline use |
| `SYS-PWA-03` | Once cached, every GET request is answered from the cache first, then from the network; a successful same-origin answer is added to the cache; without network, a page request falls back to `index.html`. | Offline use |
| `SYS-PWA-04` | A release changes `VERSION` (`tools/bump_version.py`), hence the cache name; on activation the new service worker deletes every older cache and takes control of the open pages (`skipWaiting`, `clients.claim`). Between two releases, a changed `sw.js` reinstalls and refreshes the files of `ASSETS` in the same cache. | Updates |
| `SYS-PWA-05` | The manifest declares the name « Volley Live Capture », short name « Volley Live », start URL `./index.html`, standalone display, any orientation, theme and background `#071a34`, and the 192 and 512 px icons. | Installability |
| `SYS-PWA-06` | Icons are square, opaque and borderless; the Home-screen artwork (`apple-touch-icon.png` and the manifest icons) comes from the supplied master. | SYS-DESIGN |
| `SYS-PWA-07` | On iPhone and iPad, when the application is not installed, the Home screen shows how to add it to the Home screen. | iOS has no install prompt |
| `SYS-PWA-08` | The application asks the browser for persistent storage so that the recorded matches are not evicted. | Data durability |

## 5. States, errors and edge cases

| Situation | Behaviour |
|---|---|
| Service worker registration fails | Console warning; the application still runs online. |
| Persistent storage refused | No message; the browser may evict data under storage pressure (iOS: data of a non-installed site may be cleared after a period without use). |
| File missing from `ASSETS` | Works online; offline, only if it was fetched once before (runtime caching). The shell test fails. |

## 6. Data

Cache `volley-live-capture-v<VERSION>` (`VERSION` file). No match data is stored in the cache.

## 7. Interface

`sw.js` handles `install` (cache `ASSETS`), `activate` (delete older caches) and `fetch` (`SYS-PWA-03`).
`js/index-pwa.js` registers it, shows `#homeInstall` and calls `navigator.storage.persist()`.

## 8. Accessibility and language

The install hint is a Home-screen text translated like the others (`home.install*` keys, SYS-I18N).

## 9. Acceptance and traceability

| Requirement | Verified by |
|---|---|
| `SYS-PWA-01`, `-02` | `tests/capture/test_capture_regressions.py::test_pwa_cache_version_and_shell_assets`; `tests/spectator/test_compact_score_delta.py::test_offline_cache_and_four_visual_baselines`; `tests/teams/test_team_management.py` (Team Management files in the shell) |
| `SYS-PWA-03`, `-04` | Manual: install over HTTPS, go offline, reload (the application opens); release a new `VERSION`, reopen online (the old cache is deleted, new files served) |
| `SYS-PWA-05`, `-06` | `tests/shared/test_icon.py::test_manifest_html_and_service_worker_reference_correct_assets`, `::test_icons_are_full_square_opaque_and_borderless`; `tests/shared/test_pwa_icons.py::test_supplied_artwork_drives_all_pwa_icons` |
| `SYS-PWA-07` | Manual: open on iPhone in Safari (hint shown), then from the Home screen (hint hidden) |
| `SYS-PWA-08` | Manual: in the browser developer tools, the site storage is « persistent » after the first visit (browser support permitting) |

## 10. History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-27 | First version; replaces `docs/IOS_IMPLEMENTATION_SPEC.md` and `docs/INSTALL_IPHONE.md` (v1.6.10) and the service worker notes of `docs/IMPLEMENTATION_SPEC.md`. |
