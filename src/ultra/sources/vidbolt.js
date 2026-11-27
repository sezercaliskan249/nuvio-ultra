/**
 * VidBolt (vidbolt.xyz) — 1080p HLS (kalite kapılı yedek kaynak)
 * VyseTV'nin açık kaynak kodundan (film_sources/scrapers.dart, GPL-3.0) uyarlandı.
 *
 *   https://vidbolt.xyz/api/resolve?type=movie&id=<tmdb>&prefer=orion
 *   https://vidbolt.xyz/api/resolve?type=tv&id=<tmdb>&season=<S>&episode=<E>&prefer=orion
 *   (sitenin oynatıcısındaki gizli parametreler: prefer= / only= / exclude=a,b)
 *
 * Cevap: { stream: { server, sources:[{url, kind, quality, language, master}], subtitles } }
 * Sunucu her istekte değişebiliyor ve kalitesi çok farklı (canlı test, 27.11.2026):
 *   Orion    -> 1080p, İngilizce + Hintçe ses, altyazılar      ✅ iyi (bazen kapalı)
 *   Luna     -> 720p, varsayılan ses İTALYANCA                 ✗ atlanır
 *   Callisto -> MovieBox; doğrudan hakunaymatata linkleri 403, /m/ vekil linklerin parçaları açılmıyor ✗
 * Bu yüzden KALİTE KAPISI var: sadece doğrulanmış ≥1080p + açılan sunucu + İngilizce/Türkçe ses
 * olan linkler kart olur. Kapıdan geçen yoksa kart yok, 🔍 satırı nedenini yazar.
 * iPhone'da (mpv) 6'dan fazla ses+altyazı listesi olan master atlanır: mpv hepsini açılışta indiriyor.
 * Liste ayrı ses grubu kullandığı için master adresi verilir (alt liste tek başına sessiz olur).
 */

import { req } from "../tr/common.js";
import { parseMaster, qualityOfVariant, videoTags, mbpsOf, resLabel, audioNames } from "../hlsinfo.js";

const BASE = "https://vidbolt.xyz";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
const API_HEADERS = { "User-Agent": UA, Referer: BASE + "/", Origin: BASE, Accept: "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9" };
const PLAY_HEADERS = { "User-Agent": UA, Referer: BASE + "/", Origin: BASE };

// Oynatılamayan (403 / parçaları açılmayan) MovieBox adresleri
const DEAD_HOSTS = /^https?:\/\/[^/]*(hakunaymatata\.com|hakunamata\.vidbolt\.xyz)\//i;
const MAX_TRACKS_IOS = 6;
const isEnTr = (code) => /^(en|eng|tr|tur)$/i.test(String(code || ""));

function langOk(label) {
  const l = String(label || "").trim();
  if (!l) return true;
  if (/t[üu]rk/i.test(l)) return true; // Türkçe dublaj veya Türkçe altyazı (gömülü)
  return /^english$/i.test(l);
}

export async function getVidboltStreams(tmdbId, mediaType, season, episode, diag) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const s = parseInt(season, 10) || 1;
  const e = parseInt(episode, 10) || 1;
  const url = isTv
    ? `${BASE}/api/resolve?type=tv&id=${tmdbId}&season=${s}&episode=${e}&prefer=orion`
    : `${BASE}/api/resolve?type=movie&id=${tmdbId}&prefer=orion`;

  const r = await req(url, { headers: API_HEADERS, timeout: 12000 });
  let data = null;
  try {
    data = JSON.parse(r.text);
  } catch (err) {}
  const stream = data && data.stream;
  if (!r.ok || !stream) {
    diag && diag.fail(r.ok ? "bu içerik için sunucu yok" : `cevap yok (${r.timeout ? "zaman aşımı" : r.status ? `HTTP ${r.status}` : "bağlantı yok"})`);
    return [];
  }
  // iPhone (mpv) açılışta TÜM ses/altyazı listelerini indirir; yavaş sunucuda 20+ liste = dakikalarca bekleme
  // (canlı test: 21 ses + 52 altyazılı bölüm 170 sn'de açılmadı). Android (ExoPlayer) sadece seçileni indirir.
  const ios = r.statusText === "OK";
  const server = stream.server ? String(stream.server).charAt(0).toUpperCase() + String(stream.server).slice(1) : "";

  const items = [];
  (Array.isArray(stream.sources) ? stream.sources : []).forEach((it) => it && it.url && items.push(it));
  if (stream.url && !items.some((it) => it.url === stream.url)) items.push({ url: stream.url, quality: stream.quality, kind: stream.kind, master: "" });

  const reject = {};
  const no = (why) => (reject[why] = (reject[why] || 0) + 1);
  const out = [];
  const seen = {};
  for (const it of items.slice(0, 6)) {
    if (out.length >= 2) break;
    if (typeof it.url !== "string" || !/^https?:/.test(it.url) || seen[it.url]) continue;
    seen[it.url] = true;
    if (DEAD_HOSTS.test(it.url)) {
      no("açılmayan MovieBox linki");
      continue;
    }
    if (!langOk(it.language)) {
      no(`dil: ${it.language}`);
      continue;
    }
    if (!(it.kind === "hls" || /\.m3u8/i.test(it.url) || it.master)) {
      no("doğrulanamayan MP4");
      continue;
    }
    // Çözünürlük doğrulaması: liste cevapta yoksa 1 istekle oku
    let text = it.master || "";
    if (!/#EXT-X-STREAM-INF/.test(text)) {
      const m = await req(it.url, { headers: PLAY_HEADERS, timeout: 6000 });
      text = m.ok ? m.text : "";
    }
    const info = parseMaster(text, it.url);
    const top = info.variants[0];
    const q = qualityOfVariant(top);
    if (!top || ["4K", "1440p", "1080p"].indexOf(q) === -1) {
      no(top ? `${q}` : "liste açılmadı");
      continue;
    }
    if (info.audios.length && !info.audios.some((a) => isEnTr(a.lang))) {
      no(`ses: ${info.audios.map((a) => a.lang).join("+")}`);
      continue;
    }
    const tracks = info.audios.length + info.subs.length;
    if (ios && tracks > MAX_TRACKS_IOS) {
      no(`iPhone'da çok yavaş açılır (${tracks} ses/altyazı listesi)`);
      continue;
    }
    const subTr = /t[üu]rk/i.test(it.language || "") && /sub/i.test(it.language || "");
    const dubTr = /t[üu]rk/i.test(it.language || "") && !subTr;
    const notes = [`✅ Doğrulandı: ${resLabel(top)}`];
    if (subTr) notes.push("💬 Türkçe altyazı videoya gömülü");
    if (info.subs.length) notes.push(`💬 ${info.subs.length} dilde altyazı (oynatıcının menüsünden)`);
    out.push({
      url: it.url,
      quality: q,
      type: "direct",
      source: "vidbolt",
      server,
      format: "HLS",
      extraTags: videoTags(top),
      lang: (dubTr ? "Türkçe Dublaj" : audioNames(info.audios)) || undefined,
      mbps: mbpsOf(top) || undefined,
      note: notes.join("\n"),
      headers: Object.assign({}, PLAY_HEADERS),
    });
  }

  if (!out.length) {
    const sum = Object.keys(reject).map((k) => `${reject[k]}× ${k}`).join(", ");
    diag && diag.fail(`${server || "sunucu"}: kalite kapısından geçen yok (${sum || "link yok"})`);
    return [];
  }
  diag && diag.step(`${server}: ${out.map((x) => x.quality).join(", ")}`);
  return out;
}
