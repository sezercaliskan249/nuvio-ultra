# Changelog

All notable changes to this project. Versions follow [Semantic Versioning](https://semver.org/).

## [1.0.10] — 2026-11-24
### Improved
- **Faster stream lists for Ultra DiziBak and Ultra Anime.** On phones Nuvio runs plugin requests one after another, and only a few plugins at a time (later plugins wait for a free slot), so every request counts.
  - DiziBak: 7 → **4 requests**. The episode address is guessed directly (`<show>-S-sezon-E-bolum`) and the category search is used only as a fallback. Quality is read from the file name instead of downloading the playlist. The storage-host lookup no longer needs a verification request.
  - Anime: returns **immediately (1 request)** for titles that are not tagged *Animation* on TMDB (it used to run up to 4 site searches). At most 2 searches and 2 fansub translations (each translation costs 2 requests).
- **Ultra Anime starts faster on iPhone.** AnizmPlayer masters list 4 qualities plus a separate audio track; mpv opens and probes all of them before the first frame (~16 connections). On iPhone the card now uses an mpv EDL link that opens only the best quality + audio (~6 connections). In a simulation with 2 s per connection: 27–31 s → 19 s. Android (ExoPlayer, which already opens only one quality) keeps the normal link. The platform is detected from Nuvio's fetch (iOS Ktor/Darwin always reports `statusText: "OK"`, Android OkHttp reports an empty one over HTTP/2).
  - A fallback card with the normal link is added on iPhone in case the fast link doesn't open.

## [1.0.9] — 2026-11-24
### Fixed
- **Ultra Anime: videos never started** (stuck on "starting"). AnizmPlayer serves its HLS master as `master.txt`; the iPhone player (mpv / FFmpeg) refuses to treat a `.txt` URL as HLS ("Not detecting m3u8/hls with non standard extension"), and the old `#.m3u8` suffix didn't help because the fragment is ignored. The plugin now hands out `master.txt.m3u8`, which the server answers with the proper `application/x-mpegURL` type — tested in mpv: picture after ~2 s, 1080p.
### Improved
- **Ultra DiziBak: faster start and seeking.** The CDN redirected **every** 8–12 s segment with a 301 to a storage host (+~0.4 s per segment). The plugin now detects that host once and gives the player the playlist directly from it, so segments load without a redirect.
- **Ultra Anime:** multiple fansub translations are resolved in parallel.
### Checked (no change needed)
- **Vidlink qualities** were verified with ffprobe on 6 titles: the 4 cards are different files with different resolutions (e.g. Breaking Bad S1E1: 1920×1080 / 1280×720 / 850×480 / 640×360). Older 4:3 anime such as Naruto Shippuden are low-resolution at the source, so "1080p" (1392×1080) and "720p" (1280×994) look almost identical. The labels come from Vidlink and are occasionally off by one step.

## [1.0.8] — 2026-11-26
### Changed
- **Ultra Vixolity moved up** to the 2nd place (right after Ultra Archive, above Ultra Movy).
### Removed
- **Ultra SezonlukDizi** — sezonlukdizi.cc now puts a reCAPTCHA in front of every player request, which a plugin cannot solve, so it returned no links. Turkish series are covered by Ultra Vixolity (Turkish dub + subtitles, 1080p), Ultra FilmModu and Ultra DiziBak. The source code stays in `src/` in case the site drops the captcha.

## [1.0.7] — 2026-11-26
### Added
- **Ultra Vixolity** — Turkish dub + Turkish subtitles for movies **and series**, 1080p HLS, no captcha / Cloudflare, about 1 s per title (direct IMDb lookup).
  - Most popular titles carry a **Türkçe** audio track next to the original (e.g. Stranger Things, Squid Game, House of the Dragon, The Last of Us, The Matrix, Inception).
  - Subtitles (Turkish / English) are tracks inside the playlist; a track labelled "Sesotho" (`st`) is Turkish and is announced on the card.
  - Playlists and segments require the Vixolity headers; they are attached to the stream so Android's player doesn't fall back to its own User-Agent.
- **Ultra DiziBak** — series with burned-in Turkish subtitles (720p HLS) from dizibak.net, no captcha.
  - Uses the site's WordPress REST API: every HTML page is ~1.1 MB with the needed data at the very end, while Nuvio on Android cuts plugin responses at 1 MB. API answers are 1–2 KB, which also makes it faster (~2 s).
- **Ultra Anime** — anime with burned-in Turkish subtitles from DiziWatch / AnizmPlayer, up to 1080p (adaptive 1080p/720p/480p), one card per fansub translation (max 3), no captcha.
  - Matched by TMDB poster, or name + year. Seasons follow TMDB; long shows listed as a single season (One Piece) use the absolute episode number automatically.
  - AnizmPlayer playlists need an `Accept` header (otherwise "security error"); it is attached to the stream.
  - Sibnet is used as a fallback when an episode has no AnizmPlayer copy.
  - Nuvio's "Test" button (TMDB 603) is answered with Frieren S1E1.
### Changed
- Turkish cards: "subtitles burned into the video" is now worded explicitly; sources can describe in-stream subtitle tracks.
### Not added (tested)
- DDiziBox / DiziMom: return exactly the same Pilavyer streams as Ultra FilmModu (same video IDs) — no new content.
- DiziYou, YabanciDizi, DiziPod, dizibak.com, Anizm (anizm.net), AnimeciX, Anizium: Cloudflare challenge. HDFilmCehennemi: HTTP 451. DiziBoxIzle, Sinewix: no streams.

## [1.0.6] — 2026-11-26
### Fixed (Android)
- **Vidlink links did not play on Android.** The Vidlink CDN (`bcdn.hakunaymatata.com`) answers `428` to any User-Agent starting with `Mozilla/`. Nuvio's Android player (ExoPlayer) sends a desktop Chrome User-Agent when the stream has none, while the iOS player (mpv) sends `Lavf/…`. Vidlink streams now carry `User-Agent: Lavf/60.3.100` explicitly (tested: `206 video/mp4`, previously `428`).
- HLS streams now include `type: "hls"`. ExoPlayer guesses the format from the URL extension, so extension-less playlists (FilmModu `stream.php?v=…`, VidRock) first failed and needed a retry on Android. iOS ignores this field.

## [1.0.5] — 2026-11-25
### Fixed
- **Ultra FilmModu** moved to the new FilmModu site (filmmodu.live → filmmodu.icu, Pilavyer player). The old filmmodu.one video server (imgsapi.pro) now answers every playlist with a plain "404".
  - One HLS stream per title with Turkish dub + original audio tracks and Turkish / English `.vtt` subtitles.
  - Titles are verified by original name + year from the page's structured data.
  - The old site is kept as a fallback and is only used when its playlist is a real m3u8.
### Added
- **Ultra FilmModu now supports TV series** (`/dizi/<slug>/sezon-S/bolum-E`).
- Ultra SezonlukDizi / Ultra Webteizle: detect when the site answers player requests with a reCAPTCHA page and say so clearly in the 🔍 line.

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
