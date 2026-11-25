/**
 * Movy (movy.sx / vidy.st) — 12 sunucu, 4K'ya kadar HLS
 * VyseTV'nin açık kaynak kodundan (lib/data/sources/sources.dart, GPL-3.0) uyarlandı.
 *
 * Akış:
 *   1. https://api.wecollege.net/seed?mediaId=TMDB        -> {seed}   (~30 sn geçerli)
 *   2. https://api.wecollege.net/<sunucu>/sources?...&enc=2&seed=..  -> şifreli metin
 *   3. Şifre çöz (FNV/mix tabanlı akış şifresi, "mvm1" imzası) -> {sources:[{url,quality}], playlist}
 *   Oynatma başlıkları: Origin/Referer https://www.vidy.st
 */

import { req } from "../tr/common.js";
import { getMediaInfo } from "../tmdb.js";
import { b64decodeBytes, utf8Decode } from "../lib/b64.js";
import { parseM3U8 } from "../m3u8.js";

const API = "https://api.wecollege.net";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, Referer: "https://www.vidy.st/", Origin: "https://www.vidy.st", Accept: "application/json, text/plain, */*" };
const PLAY_HEADERS = { "User-Agent": UA, Referer: "https://www.vidy.st/", Origin: "https://www.vidy.st" };

// Sıra movy.sx'in kendi listesiyle aynı. Miami ve Boise sitede "4K olabilir" diye işaretli.
// alt = orijinal isim farklıysa altTitle da gönderilir (sitede Nashville ve Chicago böyle).
// (Almanca/Fransızca/İspanyolca/Hintçe sunucular atlandı)
const SERVERS = [
  ["miami", "Miami"], ["boise", "Boise"], ["nashville", "Nashville", true], ["chicago", "Chicago", true],
  ["vegas", "Vegas"], ["dallas", "Dallas"], ["reno", "Reno"], ["oakland", "Oakland"],
  ["seattle", "Seattle"], ["phoenix", "Phoenix"], ["atlanta", "Atlanta"], ["portland", "Portland"], ["austin", "Austin"],
];
// Nuvio'da istekler SIRAYLA gider (fetch senkron). VyseTV de sadece Miami'yi sorup oynatıyor,
// diğer sunuculara yalnızca o boş dönerse geçiyor. Biz de aynısını yapıyoruz:
// İLK çalışan sunucuda dur (genelde Miami -> toplam 3 istek). En geç 20 sn'de bırak.
const BUDGET_MS = 20000;
const MAX_RESULTS = 8;

// ---- şifre çözme ----------------------------------------------------------
const M32 = 0xffffffff, SLOTS = 61, MS = 2654435769, ACCX = 2779096485;
const u = (x) => x >>> 0;
const rotl = (v, n) => ((n &= 31) ? u((v << n) | (v >>> (32 - n))) : u(v));
function mix(l) {
  l = u(l ^ (l >>> 16));
  l = u(Math.imul(l, 2246822507));
  l = u(l ^ (l >>> 13));
  l = u(Math.imul(l, 3266489909));
  return u(l ^ (l >>> 16));
}
function fnv(s) {
  let o = 2166136261;
  for (let i = 0; i < s.length; i++) o = u(Math.imul(u(o ^ s.charCodeAt(i)), 16777619));
  return mix(o);
}
function makeCipher(seed, id) {
  const S = new Array(SLOTS).fill(0);
  const P = new Array(SLOTS).fill(false);
  let i = mix(u(fnv(seed) ^ mix(u(id ^ MS))));
  for (let r = 0; r < 8; r++) {
    const n = i % SLOTS;
    i = rotl(u(i + MS), 7 + (r & 7));
    S[n] = u(i ^ mix(i));
    P[n] = true;
    i = mix(u(i + n));
  }
  let acc = mix(u(i ^ ACCX));
  return function next(off) {
    const r = acc % SLOTS;
    const neg = P[r] ? M32 : 0;
    const x = u(S[r] ^ u(Math.imul(MS, off + 1)));
    let g = u((acc ^ x) | (acc & x & neg));
    g = u(rotl(u(g + acc), r & 31) ^ rotl(acc, (r * 7) & 31));
    acc = mix(u(g + MS));
    S[r] = acc;
    P[r] = true;
    return acc;
  };
}
export function movyDecrypt(enc, seed, id) {
  const raw = b64decodeBytes(enc);
  const next = makeCipher(String(seed), Number(id));
  let cur = 0, off = 0;
  while (cur < raw.length) {
    const d = next(off++);
    for (let k = 0; k < 4 && cur < raw.length; k++) raw[cur++] ^= (d >>> (8 * k)) & 255;
  }
  if (raw[0] !== 109 || raw[1] !== 118 || raw[2] !== 109 || raw[3] !== 49) throw new Error("movy: imza tutmadı");
  return utf8Decode(raw, 4);
}

function describe(r) {
  if (!r) return "cevap yok";
  if (r.timeout) return "zaman aşımı";
  if (!r.status) return "bağlantı kurulamadı";
  if (/cloudflare|attention required|just a moment|you have been blocked/i.test(r.text || "")) return `Cloudflare engeli (${r.status})`;
  return `HTTP ${r.status}`;
}

function quality(raw, url) {
  const s = String(raw || "");
  if (/4K|2160/.test(s) || /2160p/.test(url)) return "4K";
  for (const q of ["1080", "720", "480", "360"]) if (s.indexOf(q) !== -1) return q + "p";
  return "Auto";
}
const RANK = { "4K": 5, "1440p": 4.5, "1080p": 4, "720p": 3, "480p": 2, "360p": 1, Auto: 3.5 };

function fmtOf(url) {
  if (/\.mpd(\?|$)/.test(url)) return "DASH";
  if (/\/mp4\/|\.mp4(\?|$)/.test(url) && !/\.m3u8/.test(url)) return "MP4";
  return "HLS";
}

// VyseTV'deki "Kalite" menüsünün karşılığı: her kalite AYRI kart olur (4K / 1080p / 720p / 480p).
// Kalite, mümkünse oynatma listesinin içindeki gerçek çözünürlükten (RESOLUTION=3840x2160) okunur;
// okunamazsa sunucunun verdiği etiket kullanılır ve kartta "etiket" diye belirtilir.
async function buildCards(master, streams) {
  // 1) Çözünürlükleri listeden oku: master varsa o, yoksa en iyi akış (o da master olabilir) -> 1 istek
  const probe = master || (fmtOf(streams[0].url) === "HLS" ? streams[0].url : null);
  if (probe) {
    const r = await req(probe, { headers: PLAY_HEADERS, timeout: 6000 });
    if (r.ok && /#EXT-X-STREAM-INF/.test(r.text || "")) {
      const best = {};
      parseM3U8(r.text, r.url || probe).forEach((v) => {
        if (!v.url || !v.resolution) return;
        const q = v.quality;
        if (!(q in RANK)) return;
        if (!best[q] || (v.bandwidth || 0) > (best[q].bandwidth || 0)) best[q] = v;
      });
      const qs = Object.keys(best);
      if (qs.length) {
        return qs
          .sort((a, b) => RANK[b] - RANK[a])
          .map((q) => {
            const v = best[q];
            const mb = v.bandwidth ? `  ·  ~${Math.max(1, Math.round(v.bandwidth / 1e6))} Mbps` : "";
            return { url: v.url, q, format: "HLS", note: `✅ Doğrulandı: ${v.resolution.replace("x", "×")}${mb}` };
          });
      }
    }
  }
  // 2) Liste okunamadı -> sunucunun verdiği her kalite ayrı kart (etiketine göre)
  const byQ = {};
  streams.forEach((s) => {
    if (!byQ[s.q]) byQ[s.q] = s;
  });
  const cards = Object.keys(byQ)
    .sort((a, b) => RANK[b] - RANK[a])
    .map((q) => ({ url: byQ[q].url, q, format: fmtOf(byQ[q].url), note: "ℹ️ Kalite sunucunun etiketi (doğrulanamadı)" }));
  if (master) cards.unshift({ url: master, q: "Auto", format: "HLS", note: "🔄 Otomatik kalite (bağlantına göre)" });
  return cards;
}

async function getSeed(tmdbId) {
  let r = null;
  for (let t = 0; t < 2; t++) {
    r = await req(`${API}/seed?mediaId=${tmdbId}`, { headers: H, timeout: 7000 });
    try {
      const j = JSON.parse(r.text);
      if (j && j.seed) return { seed: String(j.seed), at: Date.now(), ttl: j.ttlMs || 30000 };
    } catch (e) {}
    if (r.status === 403 || r.status === 0) break; // engel / bağlantı yok: tekrar denemek boşa
  }
  return { seed: null, r };
}

export async function getMovyStreams(tmdbId, mediaType, season, episode, diag) {
  const t0 = Date.now();
  const info = await getMediaInfo(tmdbId, mediaType);
  const isTv = info.isTv;
  const type = isTv ? "tv" : "movie";

  let S = await getSeed(tmdbId);
  if (!S.seed) {
    diag && diag.fail(`1. adım (seed) başarısız: ${describe(S.r)}`);
    return [];
  }
  diag && diag.step("1. adım (seed) ✓");

  const title = info.title || info.originalTitle || "";
  const orig = info.originalTitle && info.originalTitle !== title ? info.originalTitle : "";
  const enc2 = (v) => encodeURIComponent(encodeURIComponent(v)); // site title'ı 2 kez kodluyor
  const query = (alt, seed) => {
    const q = [
      "title=" + enc2(title),
      "mediaType=" + type,
      "year=" + (info.year || ""),
      "episodeId=" + (isTv ? episode || 1 : 1),
      "seasonId=" + (isTv ? season || 1 : 1),
      "tmdbId=" + tmdbId,
    ];
    if (isTv) q.push("totalSeasons=" + (info.seasons || 1));
    if (info.imdbId) q.push("imdbId=" + info.imdbId);
    if (alt && orig) q.push("altTitle=" + enc2(orig));
    q.push("enc=2", "seed=" + encodeURIComponent(seed));
    return q.join("&");
  };

  const why = {};
  const note = (k) => (why[k] = (why[k] || 0) + 1);
  const out = [];
  let tried = 0;
  let foundAt = null;
  for (const [shard, name, alt] of SERVERS) {
    if (foundAt || Date.now() - t0 > BUDGET_MS) break;
    tried++;
    // Seed ~30 sn yaşar; süresi dolmak üzereyse yenile
    if (Date.now() - S.at > S.ttl - 8000) {
      const n = await getSeed(tmdbId);
      if (n.seed) S = n;
    }
    let r = await req(`${API}/${shard}/sources?${query(alt, S.seed)}`, { headers: H, timeout: 8000 });
    if (r.status === 401) {
      // site da böyle yapıyor: seed geçersizse yenile, bir kez daha dene
      const n = await getSeed(tmdbId);
      if (n.seed) {
        S = n;
        r = await req(`${API}/${shard}/sources?${query(alt, S.seed)}`, { headers: H, timeout: 8000 });
      }
    }
    const enc = (r.text || "").trim();
    if (!r.ok) {
      note(describe(r));
      continue;
    }
    if (!enc) {
      note("boş cevap");
      continue;
    }
    let data;
    try {
      data = JSON.parse(movyDecrypt(enc, S.seed, tmdbId));
    } catch (e) {
      note(/imza/.test(String(e && e.message)) ? "şifre çözülemedi" : "bozuk veri");
      continue;
    }
    const seen = {};
    const streams = [];
    (data.sources || []).forEach((s) => {
      const url = s && (s.url || s.file);
      if (typeof url !== "string" || !/^https?:/.test(url) || seen[url]) return;
      seen[url] = 1;
      streams.push({ url, q: quality(s.quality || s.label, url) });
    });
    if (!streams.length) {
      note("bu filmde link yok");
      continue;
    }
    streams.sort((a, b) => RANK[b.q] - RANK[a.q]);
    const master = typeof data.playlist === "string" && /^https?:/.test(data.playlist) ? data.playlist : null;
    const subs = (data.subtitles || data.tracks || [])
      .filter((t) => t && (t.url || t.file))
      .slice(0, 8)
      .map((t) => ({ url: t.url || t.file, language: t.lang || t.language || t.label || "en", name: t.label || t.lang || "Altyazı" }));
    const cards = await buildCards(master, streams);
    cards.forEach((c) =>
      out.push({
        url: c.url,
        quality: c.q,
        type: "direct",
        source: "movy",
        server: name,
        format: c.format,
        note: c.note,
        headers: PLAY_HEADERS,
        subtitles: subs.length ? subs : undefined,
      })
    );
    if (cards.length) foundAt = foundAt || name;
  }
  if (diag) {
    const sum = Object.keys(why).map((k) => `${why[k]}× ${k}`).join(", ");
    const secs = Math.round((Date.now() - t0) / 1000);
    if (!out.length) diag.fail(`2. adım (sunucular) başarısız: ${sum || "cevap yok"} · ${tried} sunucu, ${secs} sn`);
    else diag.step(`${foundAt}: ${out.length} kalite (${tried} sunucu denendi, ${secs} sn)`);
  }
  return out.slice(0, MAX_RESULTS);
}
