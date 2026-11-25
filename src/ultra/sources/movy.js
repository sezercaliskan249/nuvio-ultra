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

const API = "https://api.wecollege.net";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, Referer: "https://www.vidy.st/", Origin: "https://www.vidy.st", Accept: "application/json, text/plain, */*" };
const PLAY_HEADERS = { "User-Agent": UA, Referer: "https://www.vidy.st/", Origin: "https://www.vidy.st" };

// İngilizce sesli sunucular (Almanca/Fransızca/İspanyolca/Hintçe olanlar atlandı)
const SERVERS = [
  ["miami", "Miami"], ["boise", "Boise"], ["nashville", "Nashville"], ["chicago", "Chicago", true],
  ["vegas", "Vegas"], ["reno", "Reno"], ["oakland", "Oakland"], ["seattle", "Seattle"],
  ["phoenix", "Phoenix"], ["atlanta", "Atlanta"], ["portland", "Portland"], ["austin", "Austin"],
];
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

function quality(raw, url) {
  const s = String(raw || "");
  if (/4K|2160/.test(s) || /2160p/.test(url)) return "4K";
  for (const q of ["1080", "720", "480", "360"]) if (s.indexOf(q) !== -1) return q + "p";
  return "Auto";
}
const RANK = { "4K": 5, "1080p": 4, "720p": 3, "480p": 2, "360p": 1, Auto: 3.5 };

export async function getMovyStreams(tmdbId, mediaType, season, episode, diag) {
  const info = await getMediaInfo(tmdbId, mediaType);
  const isTv = info.isTv;
  const type = isTv ? "tv" : "movie";
  const sr = await req(`${API}/seed?mediaId=${tmdbId}`, { headers: H, timeout: 7000 });
  let seed = null;
  try {
    seed = JSON.parse(sr.text).seed;
  } catch (e) {}
  if (!seed) {
    diag && diag.fail(`seed alınamadı (${sr.status || (sr.timeout ? "zaman aşımı" : "bağlantı yok")}${/cloudflare|blocked/i.test(sr.text) ? ", Cloudflare engeli" : ""})`);
    return [];
  }
  const title = info.title || info.originalTitle || "";
  const base = [
    "title=" + encodeURIComponent(encodeURIComponent(title)),
    "mediaType=" + type,
    "year=" + (info.year || ""),
    "tmdbId=" + tmdbId,
    "enc=2",
    "seed=" + encodeURIComponent(seed),
  ];
  if (info.imdbId) base.push("imdbId=" + info.imdbId);
  if (isTv) base.push("seasonId=" + (season || 1), "episodeId=" + (episode || 1), "totalSeasons=" + (info.seasons || 1));

  let answered = 0;
  const lists = await Promise.all(
    SERVERS.map(async ([shard, name, alt]) => {
      const q = base.slice();
      if (alt && title) q.push("altTitle=" + encodeURIComponent(encodeURIComponent(title)));
      const r = await req(`${API}/${shard}/sources?${q.join("&")}`, { headers: H, timeout: 8000 });
      const enc = (r.text || "").trim();
      if (!r.ok || !enc) return [];
      let data;
      try {
        data = JSON.parse(movyDecrypt(enc, seed, tmdbId));
      } catch (e) {
        return [];
      }
      answered++;
      const seen = {};
      const streams = [];
      (data.sources || []).forEach((s) => {
        const url = s && (s.url || s.file);
        if (typeof url !== "string" || !/^https?:/.test(url) || seen[url]) return;
        seen[url] = 1;
        streams.push({ url, q: quality(s.quality || s.label, url) });
      });
      if (!streams.length) return [];
      streams.sort((a, b) => RANK[b.q] - RANK[a.q]);
      const master = typeof data.playlist === "string" && /^https?:/.test(data.playlist) ? data.playlist : null;
      const url = master || streams[0].url;
      const isMp4 = /\/mp4\/|\.mp4(\?|$)/.test(url) && !/\.m3u8/.test(url);
      const isDash = /\.mpd(\?|$)/.test(url);
      // Movy sunucuları altyazı da verebilir
      const subs = (data.subtitles || data.tracks || [])
        .filter((t) => t && (t.url || t.file))
        .slice(0, 6)
        .map((t) => ({ url: t.url || t.file, language: t.lang || t.language || t.label || "en", name: t.label || t.lang || "Altyazı" }));
      return [
        {
          url,
          quality: streams[0].q,
          type: "direct",
          source: "movy",
          server: name,
          format: isDash ? "DASH" : isMp4 ? "MP4" : "HLS",
          headers: PLAY_HEADERS,
          subtitles: subs.length ? subs : undefined,
        },
      ];
    })
  );
  const out = [].concat.apply([], lists);
  out.sort((a, b) => RANK[b.quality] - RANK[a.quality]);
  if (diag) {
    if (!out.length) diag.fail(answered ? `${answered} sunucu cevap verdi ama link yok` : "hiçbir sunucu cevap vermedi");
    else diag.step(`${out.length} sunucudan link`);
  }
  return out.slice(0, MAX_RESULTS);
}
