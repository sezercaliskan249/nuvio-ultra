# Troubleshooting

When a plugin returns no links it shows a line starting with `🔍` (the app labels are in Turkish).
Nuvio's **Test** button always uses *The Matrix* (TMDB 603), or *Breaking Bad* S1E1 for series-only plugins.

| Message (Turkish) | Meaning | What to do |
|---|---|---|
| `Cloudflare engeli (403)` | The site's bot protection blocked the request | Try again later or on another network (Wi-Fi ↔ mobile data) |
| `IP engelli (VPN / datacenter)` | 111477 refuses VPN / datacenter IPs | Turn your VPN off |
| `111477 sunucusu kapalı (hosting askıya alındı)` | The 111477 add-on service itself is offline | Nothing to fix on your side — it works again when the archive owner restores it |
| `jeton bitti` | 111477 link tokens for your IP are used up | Wait — about 1 token refills every 5 minutes |
| `arşivde bu başlık yok` / `film bulunamadı` / `dizi bulunamadı` | The title isn't on that site | Use another plugin |
| `1. adım (seed) başarısız` | Movy refused the session request | Check the reason after the colon (Cloudflare, timeout…) |
| `2. adım (sunucular) başarısız` | Every Movy server failed or had nothing | Usually temporary; try again later |
| `site açılmadı` | The site didn't answer or its address changed | Report it with an issue |
| `süre doldu` | The source took too long | Try again; slow mirrors are skipped next time |
| `zaman aşımı` / `bağlantı yok` | Network timeout / no connection | Check your connection |
| `Cinejoy: … bu Nuvio sürümü ikili veriyi desteklemiyor` | Ultra 4K+ / Cinejoy needs Nuvio's binary fetch (newer app versions) | Update Nuvio; CNO and VidBolt still work |
| `Cinejoy: şifreleme/çözme servisi cevap vermedi` | The enc-dec.app helper Cinejoy relies on is down | Temporary — use the CNO card meanwhile |
| `VidBolt: kalite kapısından geçen yok (…)` | VidBolt's mirror for this title was below 1080p, had a foreign default audio, a dead CDN, or too many tracks for iPhone | Normal — the reason is listed in brackets; use Cinejoy / CNO |

## Reporting a problem
Open an issue using the **Source not working** template and include the plugin name, the title,
and the exact `🔍` line text.

## Works on iPhone but not on Android

Nuvio uses different video players: **mpv on iOS**, **ExoPlayer on Android** (with mpv as a fallback).

- Some CDNs reject browser User-Agents (Vidlink, CNO in Ultra 4K+). ExoPlayer sends a desktop Chrome User-Agent unless the plugin provides one, so the plugin sets a player User-Agent where needed (Vidlink, since v1.0.6).
- ExoPlayer detects the stream format from the URL. HLS streams are marked with `type: "hls"` so extension-less playlists open directly.
- Android limits plugin HTTP responses to 1 MB. Very large pages can be cut off on Android only.
- 4K HEVC / Dolby Vision files and DTS / TrueHD audio depend on the phone's hardware decoders. If a 4K file does not play, switch the player engine to mpv in Nuvio's player settings.
