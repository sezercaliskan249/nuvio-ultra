/**
 * Ultra Stream - Nuvio Plugin Ana Giriş
 * Direkt HTTP linkler (720p / 1080p / 4K) + Torrent linkler
 *
 * Nuvio çağırır: getStreams(tmdbId, mediaType, season, episode) -> Promise<Stream[]>
 *
 * Direkt kaynaklar (paralel, her biri kendi süre sınırıyla):
 *   - 4KHDHub     : 4K / 1080p MKV (REMUX, DV, HDR)      — 4K'nın ana kaynağı
 *   - MoviesDrive : 720p / 1080p / 4K MKV (doğrulanmış)  — ikinci 4K kaynağı
 *   - Vidlink     : 360p-1080p MP4                       — en hızlı
 *   - VidRock     : 480p-1080p HLS, İngilizce sunucular  — hızlı yedek
 *   - Vixsrc      : HLS (Cloudflare izin verirse)        — bonus
 * Torrent:
 *   - Torrentio   : 25+ site, 4K / 1080p / 720p magnet
 */

import { get4KHDHubStreams } from "./sources/fourkhdhub.js";
import { getMoviesDriveStreams } from "./sources/moviesdrive.js";
import { getVidlinkStreams } from "./sources/vidlink.js";
import { getVidrockStreams } from "./sources/vidrock.js";
import { getVixsrcStreams } from "./sources/vixsrc.js";
import { getTorrentStreams } from "./sources/torrentio.js";
import { getFilmModuStreams } from "./sources/filmmodu.js";
import { getWebteizleStreams } from "./sources/webteizle.js";
import { getSezonlukDiziStreams } from "./sources/sezonlukdizi.js";
import { makeDiag } from "./tr/common.js";
import { get111477Streams } from "./sources/s111477.js";
import { getMovyStreams } from "./sources/movy.js";
import { qualityPriority } from "./m3u8.js";
import { withTimeout } from "./http.js";
import { formatStream } from "./format.js";
import { getMediaInfo } from "./tmdb.js";

// ---------------------------------------------------------------------------
// AYARLAR
// ---------------------------------------------------------------------------
const SOURCES = [
  // id, fonksiyon, açık mı, süre sınırı (ms)
  // Vixsrc: Cloudflare engelliyor -> kapalı (boşa istek atmasın)
  { id: "4KHDHub", fn: get4KHDHubStreams, enabled: true, timeout: 25000 },
  { id: "MoviesDrive", fn: getMoviesDriveStreams, enabled: true, timeout: 25000 },
  { id: "Vidlink", fn: getVidlinkStreams, enabled: true, timeout: 10000 },
  { id: "VidRock", fn: getVidrockStreams, enabled: true, timeout: 10000 },
  { id: "Vixsrc", fn: getVixsrcStreams, enabled: false, timeout: 8000 },
  { id: "Torrentio", fn: getTorrentStreams, enabled: true, timeout: 12000 },
  // Dev arşiv + Movy (ikisi de datacenter IP'lerini engelliyor; telefondan çalışır)
  { id: "111477", fn: get111477Streams, enabled: true, timeout: 18000 },
  { id: "Movy", fn: getMovyStreams, enabled: true, timeout: 18000 },
  // Türk siteleri (dublaj / altyazı)
  { id: "FilmModu", fn: getFilmModuStreams, enabled: true, timeout: 20000 },
  { id: "Webteizle", fn: getWebteizleStreams, enabled: true, timeout: 25000 },
  { id: "SezonlukDizi", fn: getSezonlukDiziStreams, enabled: true, timeout: 25000 },
];

// Nuvio'nun "Test" butonu her zaman TMDB 603 (Matrix) ile dener. Bu ID gelince
// sonuç bulunamazsa nedenini kart olarak gösteririz (teşhis). Sadece dizi
// destekleyen eklentiler için 603 yerine Breaking Bad S1E1 denenir.
const TEST_TMDB = "603";
const TEST_TV_TMDB = "1396";

const MAX_DIRECT_PER_SOURCE_QUALITY = 4; // ör. 4KHDHub'tan en fazla 4 adet 4K
const MAX_TORRENTS_PER_QUALITY = 5;
const ALLOWED_TORRENT_QUALITIES = ["4K", "1440p", "1080p", "720p"];
// ---------------------------------------------------------------------------

// Aynı kalitede hangi link önce: sarılabilir + hızlı olanlar yukarıda
function directScore(s) {
  if (s.source === "111477") return 48 - (s.mbps > 45 ? 30 : 0);
  if (s.source === "movy") return 36;
  if (s.kind) {
    // Kararsız (kotası dolmuş hesaba düşen) linkler en alta: film ortasında donar
    if (s.flaky) return 5;
    const k = { R2: 50, FSL: 45, S3: 40, ZIPDISK: 25, PIXEL: 20 };
    let v = k[s.kind] || 10;
    // Google CDN ileri sarmayı desteklemez: büyük dosyada açılış/sarma sırasında takılır
    if (s.kind === "PIXEL" && s.bytes > 15e9) v -= 12;
    // Ortalama >45 Mbps (REMUX vb.) normal ev hattında takılır -> aynı kalitede alta
    if (s.mbps > 45) v -= 30;
    return v;
  }
  if (s.source === "vidlink") return 42;
  if (s.source === "vixsrc") return 38;
  if (s.source === "vidrock") return 30 + (s.prio || 0);
  if (s.tr) {
    const host = { "Ok.ru": 6, FilmModu: 6, VidMoly: 5, PlayerJS: 4, Sibnet: 3, FileMoon: 2, Dzen: 1 };
    return 20 + (s.tr === "dublaj" ? 10 : 0) + (host[s.host] || 0);
  }
  return 10;
}

function sortStreams(streams) {
  return streams.sort((a, b) => {
    const ta = a.type === "torrent" ? 0 : 1;
    const tb = b.type === "torrent" ? 0 : 1;
    if (ta !== tb) return tb - ta; // direkt linkler önce
    const dq = qualityPriority(b.quality) - qualityPriority(a.quality);
    if (dq !== 0) return dq; // 4K > 1080p > 720p
    if (ta === 1) return directScore(b) - directScore(a);
    return (b.seeds || 0) - (a.seeds || 0);
  });
}

function limitDirect(list) {
  const counts = {};
  return list.filter((s) => {
    const key = s.source + "|" + s.quality + "|" + (s.tr || "");
    counts[key] = (counts[key] || 0) + 1;
    return counts[key] <= MAX_DIRECT_PER_SOURCE_QUALITY;
  });
}

function limitTorrents(torrents) {
  const counts = {};
  return torrents.filter((t) => {
    if (ALLOWED_TORRENT_QUALITIES.indexOf(t.quality) === -1) return false;
    counts[t.quality] = (counts[t.quality] || 0) + 1;
    return counts[t.quality] <= MAX_TORRENTS_PER_QUALITY;
  });
}

function dedupe(streams) {
  const seen = {};
  return streams.filter((s) => {
    if (!s.url || seen[s.url]) return false;
    seen[s.url] = true;
    return true;
  });
}

// Nuvio (yeni sürüm) her eklentinin sonuçlarını ayrı ayrı, geldiği anda gösterir ama
// kartları ETİKETE GÖRE ALFABETİK sıralar. Sıramızı korumak için etiketin başına
// görünmez (sıfır genişlikli) karakterlerle sıra numarası eklenir.
const RANK_CHARS = ["\u200B", "\u200C", "\u200D", "\u2060"];
function rankPrefix(i) {
  const n = Math.min(i, 63);
  return RANK_CHARS[(n >> 4) & 3] + RANK_CHARS[(n >> 2) & 3] + RANK_CHARS[n & 3];
}

export function makeGetStreams(sourceIds, tag) {
  return function (tmdbId, mediaType, season, episode) {
    return getStreamsFor(sourceIds, tag || "Ultra", tmdbId, mediaType, season, episode);
  };
}

async function getStreamsFor(sourceIds, tag, tmdbId, mediaType, season, episode) {
  const t0 = Date.now();
  const isTest = String(tmdbId) === TEST_TMDB;
  if (isTest && (mediaType === "tv" || mediaType === "series")) {
    tmdbId = TEST_TV_TMDB;
    season = 1;
    episode = 1;
  }
  console.log(`[${tag}] İstek: ${mediaType} tmdb=${tmdbId} s=${season} e=${episode}`);

  const active = SOURCES.filter((s) => s.enabled && (!sourceIds || sourceIds.indexOf(s.id) !== -1));
  const diags = {};
  const results = await Promise.all(
    active.map((src) => {
      const started = Date.now();
      const diag = (diags[src.id] = makeDiag(src.id));
      const p = Promise.resolve()
        .then(() => src.fn(tmdbId, mediaType, season, episode, diag))
        .then((r) => {
          console.log(`[${tag}] ${src.id}: ${r.length} link (${Date.now() - started} ms)`);
          return r;
        })
        .catch((e) => {
          console.log(`[${tag}] ${src.id} hata: ${e && e.message}`);
          diag.fail(`hata: ${String((e && e.message) || e).slice(0, 60)}`);
          return [];
        });
      return withTimeout(p, src.timeout, null).then((r) => {
        if (r === null) diag.fail(`süre doldu (${src.timeout / 1000} sn)`);
        return r || [];
      });
    })
  );

  let direct = [];
  let torrents = [];
  results.forEach((list) =>
    list.forEach((s) => {
      if (s.type === "torrent") torrents.push(s);
      else direct.push(s);
    })
  );

  // Gereken internet hızı = boyut / süre (ortalama). Kartta gösterilir.
  if (direct.some((s) => s.bytes)) {
    const info = await withTimeout(getMediaInfo(tmdbId, mediaType).catch(() => null), 3000, null);
    const min = info && info.runtime;
    if (min) direct.forEach((s) => {
      if (s.bytes) s.mbps = Math.round((s.bytes * 8) / (min * 60) / 1e6);
    });
  }

  direct = limitDirect(sortStreams(dedupe(direct)));
  torrents = limitTorrents(sortStreams(dedupe(torrents)));
  const all = sortStreams(direct.concat(torrents));

  const fourK = all.filter((s) => s.quality === "4K" && s.type !== "torrent").length;
  console.log(
    `[${tag}] Toplam ${all.length} (direkt ${direct.length}, 4K direkt ${fourK}, torrent ${torrents.length}) — ${Date.now() - t0} ms`
  );

  // Nuvio'ya sadece gereken alanlar
  // Yeni Nuvio kartı:  [name = kalın başlık]
  //                    [quality • size • language = küçük alt yazı, çok satır destekler]
  // `title` alanı name varken YOK SAYILIYOR -> tüm detayları `quality` alanına koyuyoruz.
  const out = all.map((s, i) => {
    const f = formatStream(s);
    const out = {
      name: rankPrefix(i) + f.name,
      title: f.title, // eski Nuvio sürümleri için
      quality: f.title, // yeni Nuvio bunu alt yazı olarak gösterir
      url: s.url,
    };
    if (s.headers) out.headers = s.headers;
    if (s.infoHash) out.infoHash = s.infoHash;
    if (s.subtitles && s.subtitles.length) out.subtitles = s.subtitles;
    return out;
  });

  // Test modunda (Matrix): sonuç vermeyen kaynakların teşhisini kart olarak ekle
  if (isTest) {
    active.forEach((src, si) => {
      const d = diags[src.id];
      const gotAny = results[si] && results[si].length;
      if (gotAny || !d || !d.steps.length) return;
      d.steps.slice(-4).forEach((st, k) => {
        const msg = `🔍 ${src.id}: ${st.ok ? "✓" : "✗"} ${st.msg}`;
        out.push({ name: rankPrefix(60 + k) + msg, title: msg, quality: "Teşhis (sadece Test'te görünür)", url: "https://teshis.invalid/" + encodeURIComponent(src.id) + "/" + k });
      });
    });
  }
  return out;
}
