# Changelog

All notable changes to this project. Versions follow [Semantic Versioning](https://semver.org/).

## [1.0.4] — 2026-11-25
### Fixed
- Ultra SezonlukDizi: the site rate-limits player requests (HTTP 429 after ~4 quick requests). Requests are now spaced out and retried once on 429.
- Ok.ru: more robust parsing (fallback that reads the `videos` list directly) and detection of blocked / deleted videos.
- VidMoly: cookies from the redirect page are carried over to the player request.
### Added
- The 🔍 line now shows *why* each player failed: host, HTTP status and page title (e.g. `ok.ru 200 video engelli/silinmiş`, `vidmoly.biz 404 sources yok`).

## [1.0.3] — 2026-11-25
### Fixed
- VidMoly links on `vidmoly.to` / `.biz` returned a JavaScript redirect page instead of the player, so no stream was found. They are now opened on `vidmoly.net` and JS redirects are followed (affects Ultra SezonlukDizi and Ultra Webteizle).
- Ultra SezonlukDizi tries the most reliable players first (VidMoly → Ok.ru → FileMoon → others → Sibnet / Dzen), one by one, and stops after 3 working ones or 30 s — fitting Nuvio's sequential network bridge.
- The 🔍 line shows the result per player, e.g. `VidMoly 2/2, Dzen 0/2 (çözülemedi)`.

## [1.0.2] — 2026-11-25
### Fixed
- Ultra SezonlukDizi: shows listed under their English name (e.g. *Money Heist* vs. *La casa de papel*) were not found. The plugin now tries the English, original and Turkish titles, falls back to the site's own search by **IMDb ID**, reads the real episode slug from the show page and checks the IMDb ID so a different show with the same name is never picked.
- Ultra Webteizle and Ultra FilmModu also search by the English title.
- The 🔍 line lists the tried addresses and the number of search results when a show isn't found.

## [1.0.1] — 2026-11-25
### Changed
- Ultra Archive: clear 🔍 messages when the 111477 add-on service is down ("Account suspended"), rate-limited (429) or returning server errors, instead of a generic "no answer". It no longer retries in those cases.

## [1.0.0] — 2026-11-24
First public release.

### Plugins
- **Ultra Archive** — 111477 open archive (1.4 PB), mostly 4K / REMUX.
- **Ultra Movy** — Movy HLS up to 4K, one card per quality with the resolution verified from the playlist.
- **Ultra 4K** — 4KHDHub + MoviesDrive: 4K / 1080p MKV (REMUX, Dolby Vision, HDR).
- **Ultra HD** — Vidlink + VidRock: fast 1080p / 720p.
- **Ultra Torrent** — Torrentio torrents with tracker and seeders.
- **Ultra FilmModu**, **Ultra Webteizle**, **Ultra SezonlukDizi** — Turkish dubbed & subtitled movies and series.

### Features
- Rich stream cards: quality, HDR / Dolby Vision, audio, size, provider and required bandwidth.
- Expired, quota-limited and unstable links filtered or flagged.
- `🔍` diagnostic line explaining why a source returned nothing.
- Each plugin bundles only its own code (13–25 KB, minified).
