# 🎬 Ultra Stream v2.4 – Nuvio eklenti deposu

4K direkt linkler, torrentler, dev arşiv ve Türkçe dublaj/altyazı: **8 ayrı eklenti**.
Nuvio her eklentinin sonucunu hazır olduğu anda gösterir; hızlılar yavaşları beklemez.

| Eklenti | Kaynak | İçerik | Durum |
|---|---|---|---|
| **Ultra 4K** | 4KHDHub + MoviesDrive | 4K / 1080p MKV (REMUX, DV, HDR) | ✅ Test edildi |
| **Ultra Arşiv** | 111477 (1.4 PB arşiv) | Film + dizi, çoğu 4K / REMUX | ⚠️ Sadece telefonda test edilebilir |
| **Ultra HD** | Vidlink + VidRock | 1080p / 720p MP4 + HLS, hızlı | ✅ Test edildi |
| **Ultra Movy** | Movy (12 sunucu) | 4K'ya kadar HLS | ⚠️ Sadece telefonda test edilebilir |
| **Ultra Torrent** | Torrentio | 4K / 1080p / 720p torrent, seed sayılı | ✅ Test edildi |
| **Ultra FilmModu** | filmmodu | 🇹🇷 Dublaj + altyazılı filmler | ✅ Linkler geliyor |
| **Ultra Webteizle** | webteizle | 🇹🇷 Dublaj + altyazılı filmler | ⚠️ Cloudflare, telefonda dene |
| **Ultra SezonlukDizi** | sezonlukdizi | 🇹🇷 Altyazılı + dublaj diziler | ⚠️ Cloudflare, telefonda dene |

## 🚀 Nuvio'ya ekleme

```
https://raw.githubusercontent.com/sezercaliskan249/nuvio-ultra/main/manifest.json
```
Nuvio → **Ayarlar → Plugins / Eklentiler → Repository ekle** → yukarıdaki adresi yapıştır
(`sezercaliskan249` ve `nuvio-ultra` kısmını kendi GitHub bilgilerinle değiştir).

**Test butonu:** her eklentinin Test'i Matrix (dizi eklentilerinde Breaking Bad 1x01) ile dener.
Bir kaynak çalışmazsa nedeni `🔍 …` satırıyla görünür (Cloudflare engeli, IP engeli, jeton bitti…).

## 🛠 Güncelleme / geliştirme (bilgisayarda)

```bash
npm install          # ilk seferde
npm run build        # src/ -> providers/*.js
node show.js ultra4k 693134 movie        # kartları Nuvio'daki gibi yazdırır
node show.js trsezonluk 1396 tv 1 1
```
Kod `src/ultra/` altında; her eklentinin girişi `src/<eklenti>/index.js`. Yeni sürümde
`manifest.json` içindeki `version` alanlarını artır ki Nuvio güncellemeyi görsün.

## 📡 Kaynaklar

| Kaynak | Tür | Kaliteler | Hız* | Not |
|---|---|---|---|---|
| **4KHDHub** | MKV | **4K** · 1080p | ~4-6 sn | REMUX / Dolby Vision / HDR / Atmos. 4K'nın ana kaynağı |
| **MoviesDrive** | MKV | **4K** · 1080p · 720p · 480p | ~2-7 sn | Kotası dolmuş linkler otomatik elenir |
| **Vidlink** | MP4 | 1080p · 720p · 480p · 360p | ~1 sn | En hızlı, ileri sarma destekli |
| **VidRock** | HLS | 1080p · 720p · 480p | ~2-3 sn | Sadece İngilizce sunucular (Nova, Orion, Lyra…) |
| ~~Vixsrc~~ | HLS | – | – | Cloudflare engelliyor, v2.2'de kapatıldı |
| **Torrentio** | Magnet | **4K** · 1080p · 720p | <1 sn | 25+ torrent sitesi, seed sayısına göre sıralı |

\* Gerçek ölçümler (bilgisayarda). Telefonda Nuvio'nun eklenti motoru daha yavaş olduğu için süreler uzar.

### Gerçek test sonuçları (tüm direkt linkler tek tek açılarak doğrulandı)

| İçerik | Direkt | 4K direkt | Torrent | Süre | Çalışan direkt |
|---|---|---|---|---|---|
| Dune: Part Two | 19 | 3 | 16 | 6.8 sn | **19/19** |
| Oppenheimer | 20 | 2 | 15 | 5.3 sn | 19/20 |
| Breaking Bad S01E01 | 18 | 2 | 15 | 5.1 sn | 17/18 |
| Superman (2025) | 14 | 4 | 15 | 5.9 sn | – |
| The Last of Us S02E01 | 19 | 4 | 15 | 5.1 sn | – |

## 📦 Ultra Arşiv (111477) ve 📺 Ultra Movy (v2.4)

| Eklenti | Kaynak | Nasıl | Sandbox testi |
|---|---|---|---|
| Ultra Arşiv | a.111477.xyz (1.4 PB, 600 bin dosya) | Arşivin kendi Stremio eklentisi `st.111477.xyz` → worker linkleri | ⚠️ Datacenter IP yasaklı, taklit cevaplarla test edildi |
| Ultra Movy | movy.sx / vidy.st, 12 sunucu | `api.wecollege.net` seed → sunucu → şifre çözme (VyseTV GPL kodundan) | ⚠️ Cloudflare datacenter IP'yi engelliyor, taklit cevaplarla test edildi |

* 111477 kuralı: IP başına 10 jeton, her arama 1 jeton, 5 dakikada 1 jeton dolar. VPN açıkken çalışmaz.
* Test butonunda neden çalışmadığı 🔍 satırıyla görünür (IP engeli / jeton bitti / arşivde yok).

## 🇹🇷 Türk siteleri (v2.3)

| Eklenti | Site | İçerik | Sandbox testi |
|---|---|---|---|
| Ultra FilmModu | filmmodu.one | Film · Dublaj + Altyazı (.vtt otomatik) | ✅ Arama, sayfa, linkler, altyazı çalışıyor · ⚠️ video akışı sadece Türkiye IP'sinden açılıyor olabilir |
| Ultra Webteizle | webteizle.info | Film · Dublaj + Altyazı | ⚠️ Cloudflare test sunucusunu engelledi, kod arşivden yazıldı |
| Ultra SezonlukDizi | sezonlukdizi.cc | Dizi · Altyazı + Dublaj | ⚠️ Cloudflare test sunucusunu engelledi, kod arşivden yazıldı |

* Kartlar: `🇹🇷 1080p · Türkçe Dublaj` / `💬 1080p · Türkçe Altyazılı`
* Sunucular: VidMoly, Ok.ru (✅ test edildi), Sibnet, FileMoon, Dzen
* **Test butonu teşhisi:** Nuvio'da eklentinin *Test* butonuna basınca (Matrix) site çalışmıyorsa
  nedeni `🔍 Webteizle: ✗ site açılmadı → Cloudflare engeli` gibi bir satırla gösterilir.
* Adres değişirse: `src/ultra/sources/<site>.js` içindeki `CANDIDATES` listesine yeni adresi ekleyip `npm run build`.

## 🏷 Nuvio'da nasıl görünür (v2.2)

Yeni Nuvio kartı iki parçadır: **kalın başlık** = `name`, altındaki **küçük yazı** = `quality • size • language`.
(`title` alanı, `name` varsa **gösterilmez** — v2.1'deki "isimler gitti" sorunu buydu.)
Bu yüzden tüm detaylar `quality` alanında gönderilir; sağ tarafta eklenti adı (Ultra 4K / HD / Torrent) yazar.

```
⚡ 4K  ·  DV HDR                                         Ultra 4K
📡 4KHDHub  ·  ⚡ Direkt  ·  Sarılabilir
🎞 BluRay · Dolby Vision · HDR · HEVC · 10bit
🔊 İngilizce + Hintçe · TrueHD · Atmos · 7.1  ·  💾 33.80 GB
📄 Dune - Part Two (2024) 2160p UHD BluRay DV HDR 10bit HEVC …

🧲 4K  ·  DV HDR                                    Ultra Torrent
📡 TorrentGalaxy  ·  🧲 Torrent
🟢 546 seed  ·  Çok hızlı  ·  💾 29.26 GB
🎞 WEB-DL · Dolby Vision · HDR · HEVC
🔊 Dolby Digital+ · Atmos · 5.1
📄 Dune.Part.Two.2024.2160p.WEB-DL.DDP5.1.Atmos.DV.HDR.H.265-FLUX[TGx]
```

> Nuvio kartları başlığa göre **alfabetik** sıralar. Sıralamayı korumak için başlığın başına görünmez
> (sıfır genişlikli) karakterlerle sıra numarası eklenir — ekranda görünmez.

| İkon | Anlamı |
|---|---|
| ⚡ / 🧲 | Direkt link / Torrent |
| 📡 | Sağlayıcı (4KHDHub, VidRock…) veya torrent sitesi (1337x, YTS, The Pirate Bay…) |
| 🎞 | Kaynak ve görüntü: REMUX, BluRay, WEB-DL, Dolby Vision, HDR, HEVC |
| 🔊 | Ses dili ve formatı: TrueHD, Atmos, 7.1 (torrentlerde ülke bayrakları) |
| 💾 | Dosya boyutu |
| 🟢 🟡 🔴 | Seed sağlığı: 30+ hızlı · 10-30 orta · 10 altı yavaş |
| `Sarılabilir` | İleri/geri sarma tam çalışır |
| `🚀 Google CDN · Sarma sınırlı` | Çok hızlı ama ileri sarma sınırlı |

Tüm biçimlendirme tek dosyada: `src/ultra/format.js`. Görünümü beğenmezsen sadece orayı değiştirmen yeterli.

> 🔊 Çift sesli dosyalarda oynatıcıdan ses parçasını **English** seç.
> ⚠️ Dolby Vision 4K dosyalar bazı telefonlarda renkleri mor/yeşil gösterebilir; öyleyse DV'siz satırı seç.

---

## 🧲 Torrentler hakkında
Torrentler `magnet:` linki olarak gelir. Nuvio oynatıcısı açamazsa linki harici bir torrent uygulamasıyla aç. En akıcı deneyim için Real-Debrid / TorBox hesabın varsa Nuvio'ya ayrıca debrid'li **Torrentio addon**'unu ekle.

---

## ⚙️ Ayarlar – `src/ultra/core.js`

```js
const SOURCES = [
  { id: "4KHDHub",     enabled: true,  timeout: 25000 },
  { id: "MoviesDrive", enabled: true,  timeout: 25000 },
  { id: "Vidlink",     enabled: true,  timeout: 10000 },
  { id: "VidRock",     enabled: true,  timeout: 10000 },
  { id: "Vixsrc",      enabled: false, timeout: 8000  },
  { id: "Torrentio",   enabled: true,  timeout: 12000 },
];
const MAX_DIRECT_PER_SOURCE_QUALITY = 4;   // kaynak başına, kalite başına link
const MAX_TORRENTS_PER_QUALITY = 5;
const ALLOWED_TORRENT_QUALITIES = ["4K", "1440p", "1080p", "720p"];
```
Bir kaynağı kapatmak için `enabled: false`. Hangi eklentinin hangi kaynakları çalıştırdığı `src/ultra4k|ultrahd|ultratorrent/index.js` içinde.
Değişiklikten sonra `node build.js ultra4k ultrahd ultratorrent` → yükle → `manifest.json` içinde `version`'ı artır.

---

## 🧪 Test araçları
```bash
node test.js 693134 movie        # stream listesini göster
node test.js 1396 tv 1 1         # dizi bölümü
node verify.js 693134 movie      # HER direkt linki açıp gerçekten video dönüyor mu kontrol et
node nuvio-sim.js 693134 movie   # 3 eklentiyi Nuvio gibi çalıştırır, kartları Nuvio'daki gibi basar
```

---

## 📁 Yapı
```
src/ultra4k/index.js      ← "Ultra 4K" eklentisi (4KHDHub + MoviesDrive)
src/ultrahd/index.js      ← "Ultra HD" eklentisi (Vidlink + VidRock)
src/ultratorrent/index.js ← "Ultra Torrent" eklentisi (Torrentio)
src/ultra/
├── core.js               ← kaynakları paralel çalıştırır, sıralar, sınırlar, Nuvio formatına çevirir
├── index.js              ← eski tek-parça sürüm (hepsi bir arada, uyumluluk için)
├── format.js             ← başlık / alt başlık tasarımı (ikonlar, etiketler)
├── http.js               ← fetch, timeout, link doğrulama (isPlayable)
├── tmdb.js               ← ortak TMDB bilgisi (tek istek, önbellekli)
├── m3u8.js               ← HLS kalite ayrıştırıcı
└── sources/
    ├── fourkhdhub.js     ← 4KHDHub
    ├── moviesdrive.js    ← MoviesDrive
    ├── hubcloud.js       ← ortak HubCloud çözücü (R2 / FSL / Google CDN)
    ├── vidlink.js        ← Vidlink
    ├── vidrock.js        ← VidRock (AES-GCM çözme, crypto-js)
    ├── vixsrc.js         ← Vixsrc
    └── torrentio.js      ← Torrentio
providers/ultra4k.js, ultrahd.js, ultratorrent.js ← derlenmiş çıktılar (Nuvio bunları çalıştırır)
```

## 🛠 Teknik notlar
- Yeni Nuvio (NuvioMobile, Kotlin) eklentileri **QuickJS** içinde çalıştırır; eski sürüm Hermes. `build.js` (esbuild, es2016) ikisiyle de uyumlu çıktı üretir.
- **Hız (v2.2):** Nuvio'nun `fetch`'i her cevabı (16 MB'a kadar) tamamen indirip JS tarafında base64'ten çözer. Bu yüzden:
  Google CDN linkleri artık test edilmez (Range'i yok sayıp MB'larca veri indiriyordu), sadece R2/worker linkleri 1 byte ile test edilir;
  her alt istek kendi süre sınırına sahip (takılan bir VidRock sunucusu diğerlerini bekletmez); 4KHDHub/MoviesDrive'da en fazla 12/8 dosya işlenir, 480p atlanır.
- `cheerio-without-node-native` ve `crypto-js` Nuvio tarafından sağlanır (external).
- **Link doğrulama:** R2 / workers.dev linkleri 1 byte'lık `Range` isteğiyle test edilir; "Generate Link Again" verenler elenir.
- Vidlink MP4 CDN'i tarayıcı User-Agent'ı görünce 428/429 döndürür; bu yüzden bu linklere bilerek header eklenmez.
- Site domain'leri değişirse `4khdhub`/`moviesdrive` adresleri topluluğun `domains.json` dosyasından otomatik güncellenir.
- Kaynaklar bağımsızdır: biri çökerse diğerleri çalışmaya devam eder.

## 🙏 Teşekkür
Kaynak mantıkları Nuvio topluluk depolarından (yoruix/nuvio-providers, D3adlyRocket/All-in-One-Nuvio) incelenip yeniden yazılmıştır.
