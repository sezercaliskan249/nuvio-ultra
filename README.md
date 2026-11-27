<div align="center">

# 🎬 Nuvio Ultra

**A plugin pack for [Nuvio](https://github.com/tapframe): 4K direct links, torrents, a 1.4 PB archive, Turkish sources and anime — in one repository.**

![version](https://img.shields.io/badge/version-1.0.11-blue)
![plugins](https://img.shields.io/badge/plugins-11-success)
![license](https://img.shields.io/badge/license-GPL--3.0-lightgrey)

</div>

---

## ⚡ Install

1. Open **Nuvio → Settings → Plugins → Add repository**
2. Paste:
   ```
   https://raw.githubusercontent.com/sezercaliskan249/nuvio-ultra/main/manifest.json
   ```
3. Enable the plugins you want. Done — updates arrive automatically when you refresh the repository.

> Keep **“Group by repository”** off to see the plugins in the recommended order below.

## 📦 Plugins

| # | Plugin | Source | Content | Formats |
|:-:|---|---|---|---|
| 1 | **Ultra Archive** | 111477 open archive | Movies & series, mostly 4K / REMUX | MKV, MP4 |
| 2 | **Ultra Vixolity** | Vixolity | 🇹🇷 1080p movies **and series** — Turkish dub audio + Turkish subtitles inside the stream | HLS |
| 3 | **Ultra Movy** | Movy (movy.sx) | HLS up to 4K, one card per quality | HLS |
| 4 | **Ultra 4K** | 4KHDHub · MoviesDrive | 4K / 1080p — REMUX, Dolby Vision, HDR | MKV |
| 5 | **Ultra 4K+** | Cinejoy · CNO · VidBolt | 4K **HDR10** (HEVC) and 4K H.264 streams, 1080p fallback; ~1–3 s | HLS |
| 6 | **Ultra HD** | Vidlink · VidRock | Fast 1080p / 720p | MP4, HLS |
| 7 | **Ultra Torrent** | Torrentio | 4K / 1080p / 720p torrents with seeders | Magnet |
| 8 | **Ultra FilmModu** | FilmModu | 🇹🇷 Turkish dubbed & subtitled movies **and series** | HLS |
| 9 | **Ultra DiziBak** | DiziBak | 🇹🇷 Series with burned-in Turkish subtitles (720p) | HLS |
| 10 | **Ultra Webteizle** | Webteizle | 🇹🇷 Turkish dubbed & subtitled movies | HLS, MP4 |
| 11 | **Ultra Anime** | DiziWatch · AnizmPlayer | 🎌 Anime with burned-in Turkish subtitles, up to 1080p, several fansub translations | HLS |

Every plugin runs independently, so fast sources appear immediately and never wait for slow ones.

## ✨ Features

- **Rich stream cards** — quality, HDR / Dolby Vision, audio, size and the provider in the subtitle line.
- **Verified quality** — Movy resolutions are read from the playlist itself (`✅ Verified: 3840×1608`), not guessed from labels.
- **Required bandwidth** — direct files show the average Mbps needed to stream them smoothly.
- **Health filtering** — expired, quota-limited and unstable links are dropped or flagged before you see them.
- **Self-diagnosis** — when a source returns nothing, a `🔍` line tells you why (Cloudflare, IP block, quota, not found…).
- **Small & fast** — each plugin ships only its own code (14–28 KB, minified).
- **Quality gate** — weaker mirrors (720p, foreign default audio, dead CDNs) are filtered out instead of cluttering the list.

## 🃏 How a card looks

```
⚡ 4K  ·  DV HDR                                         Ultra 4K
📡 4KHDHub  ·  ⚡ Direct  ·  Seekable
🎞 BluRay · Dolby Vision · HDR · HEVC · 10bit
🔊 English · TrueHD · Atmos · 7.1  ·  💾 33.80 GB
📶 ~22 Mbps needed  ·  🟢 Smooth
```

*(On the device the card labels are in Turkish.)*

## ❓ FAQ

<details>
<summary><b>A plugin shows a 🔍 line instead of links</b></summary>

That line is the reason the source returned nothing. See **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** for every message and what to do.
</details>

<details>
<summary><b>Ultra Archive stopped working after a while</b></summary>

The archive gives each IP a small pool of link tokens that refills slowly (about 1 every 5 minutes). Wait a bit and try again. It also refuses VPN / datacenter IPs — turn your VPN off.
</details>

<details>
<summary><b>Torrents don't play</b></summary>

Torrents are delivered as `magnet:` links. If Nuvio's player can't open them, use an external torrent app, or add a debrid-enabled Torrentio addon to Nuvio.
</details>

<details>
<summary><b>Where are the Turkish subtitles on Ultra Vixolity?</b></summary>

They are tracks inside the stream: open the player's subtitle menu and pick **Türkçe**. Some titles label the Turkish track as **"Sesotho" (st)** — that one is Turkish too. Turkish dub is an audio track: pick **Türkçe** in the audio menu.
</details>

<details>
<summary><b>Ultra 4K+: which card should I pick?</b></summary>

- **Cinejoy 4K · HDR** — the best picture (HEVC 10-bit HDR10, ~20 Mbps). Needs a fast connection and looks best on an HDR screen; the stream also contains 1080p / 720p.
- **CNO 4K** — H.264 SDR, ~16 Mbps, opens fastest (one request). **CNO 1080p** (~6 Mbps) is the choice for slower Wi-Fi.
- **VidBolt 1080p** — only shown when its mirror passes the quality gate (verified 1080p, English/Turkish audio).

Cinejoy relies on a third-party helper service (enc-dec.app); if that service is down only the Cinejoy card disappears. Cinejoy needs a recent Nuvio version (binary fetch support).
</details>

<details>
<summary><b>Dolby Vision looks purple / green</b></summary>

Some devices can't decode Dolby Vision. Pick the same quality without the `DV` badge.
</details>

Changes: **[CHANGELOG.md](CHANGELOG.md)**

## ⚖️ Disclaimer

This repository does **not host, upload or store any media**. The plugins only look up links that are already publicly available on third-party websites, the same way a web browser would. The authors have no control over, and take no responsibility for, the content of those websites. Users are responsible for complying with the laws of their country.

## 🙏 Credits

- [Nuvio](https://github.com/tapframe) and the [nuvio-providers](https://github.com/yoruix/nuvio-providers) template
- Community provider repositories and [VyseTV](https://gitlab.com/ayman707-ux/vysetv) (GPL-3.0), studied and re-implemented here
- [TMDB](https://www.themoviedb.org/) for metadata

Licensed under **GPL-3.0** — see [LICENSE](LICENSE).
