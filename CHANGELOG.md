# Changelog

All notable changes to this project. Versions follow [Semantic Versioning](https://semver.org/).

## [2.5.0] — 2026-11-24
### Changed
- Repository restructured: build and test scripts moved to `tools/`, documentation to `docs/`.
- Each plugin now bundles **only its own sources** and is minified: total size went from ~875 KB to ~154 KB (13–25 KB per plugin), so plugins load faster in Nuvio.
- README rewritten in English; added CHANGELOG, LICENSE (GPL-3.0), troubleshooting guide and an issue template.
### Removed
- Disabled Vixsrc source and the legacy all-in-one `ultra` plugin.

## [2.4.5]
### Fixed
- Ultra Arşiv: every file returned by the archive is shown (previously up to 4 per quality were kept, wasting tokens on hidden files).

## [2.4.4]
### Added
- Ultra Movy: one card per quality (4K / 1080p / 720p / 480p) with the resolution **verified** from the HLS playlist and the required bandwidth.
### Fixed
- Widescreen resolutions (e.g. 3840×1608) were classified by height only and labeled 1440p instead of 4K.

## [2.4.3]
### Changed
- Ultra Movy asks servers in order and stops at the first one that works, like VyseTV — results in a few seconds instead of ~35 s.
- Webteizle and SezonlukDizi use only their current addresses.

## [2.4.2]
### Fixed
- Ultra Movy returned nothing on phones: Nuvio's `fetch` is synchronous, so parallel requests ran one by one and the plugin was killed at the 60 s limit. Requests are now sequential with a 20 s budget.
- Movy request format aligned with movy.sx (double-encoded title, `altTitle`, re-seed on 401, server order with 4K servers first).
- Dead mirror addresses that could stall a plugin for 60 s removed.

## [2.4.1]
### Added
- Plugin order: Arşiv → Movy → 4K. Step-by-step 🔍 diagnostics for Movy, shown whenever a plugin returns nothing.

## [2.4.0]
### Added
- **Ultra Arşiv** (111477, 1.4 PB open archive) and **Ultra Movy** plugins.

## [2.3.1]
### Fixed
- 4K playback freezing: bitrate-aware ranking, required-bandwidth line, unstable-server detection.

## [2.3.0]
### Added
- Turkish sources: **FilmModu**, **Webteizle**, **SezonlukDizi** (dubbed / subtitled, automatic Turkish subtitles).

## [2.2.0]
### Changed
- Split into separate plugins (Ultra 4K / HD / Torrent) so fast sources appear without waiting for slow ones.

## [2.1.0]
### Changed
- Redesigned stream cards: provider in the subtitle line, tracker and seeders on torrents.

## [2.0.0]
### Added
- 4KHDHub, MoviesDrive (4K), VidRock sources and HubCloud link resolver.

## [1.1.0]
### Added
- First release: Vidlink direct links and Torrentio torrents.
