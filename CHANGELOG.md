# Changelog

All notable changes to this project. Versions follow [Semantic Versioning](https://semver.org/).

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
