# Troubleshooting

When a plugin returns no links it shows a line starting with `🔍` (the app labels are in Turkish).
Nuvio's **Test** button always uses *The Matrix* (TMDB 603), or *Breaking Bad* S1E1 for series-only plugins.

| Message (Turkish) | Meaning | What to do |
|---|---|---|
| `Cloudflare engeli (403)` | The site's bot protection blocked the request | Try again later or on another network (Wi-Fi ↔ mobile data) |
| `IP engelli (VPN / datacenter)` | 111477 refuses VPN / datacenter IPs | Turn your VPN off |
| `jeton bitti` | 111477 link tokens for your IP are used up | Wait — about 1 token refills every 5 minutes |
| `arşivde bu başlık yok` / `film bulunamadı` / `dizi bulunamadı` | The title isn't on that site | Use another plugin |
| `1. adım (seed) başarısız` | Movy refused the session request | Check the reason after the colon (Cloudflare, timeout…) |
| `2. adım (sunucular) başarısız` | Every Movy server failed or had nothing | Usually temporary; try again later |
| `site açılmadı` | The site didn't answer or its address changed | Report it with an issue |
| `süre doldu` | The source took too long | Try again; slow mirrors are skipped next time |
| `zaman aşımı` / `bağlantı yok` | Network timeout / no connection | Check your connection |

## Reporting a problem
Open an issue using the **Source not working** template and include the plugin name, the title,
and the exact `🔍` line text.
