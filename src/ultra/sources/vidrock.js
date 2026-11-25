/**
 * VidRock - direkt HLS (m3u8) kaynağı
 *
 * Akış:
 *  1) https://vidrock.net/api/movie/{tmdb}  veya  /api/tv/{tmdb}/{s}/{e}
 *     -> { Nova: { url: <şifreli>, language, type }, Orion: {...}, ... }
 *  2) url = base64url( IV[12] | ciphertext | GCM tag[16] )  — AES-256-GCM
 *     GCM şifre çözme = CTR modu, sayaç IV||00000002 ile başlar (tag doğrulamasız)
 *  3) Master m3u8'i çekip 1080p / 720p / 480p varyantlarını ayrı stream yap
 *
 * Sadece İngilizce/orijinal ses sunucuları alınır (Hindi/Tamil dublajlar atlanır).
 */

import CryptoJS from "crypto-js";
import { fetchJson, safeText, withTimeout, USER_AGENT } from "../http.js";
import { parseM3U8, qualityPriority } from "../m3u8.js";

const BASE = "https://vidrock.net";
const STREAM_KEY_HEX = "7f3e9c2a8b5d1f4e6a9c3b7d2e5f8a1c4b6d9e2f5a8c1b4d7e9f2a5c8b1d4e7f";

export const VIDROCK_HEADERS = {
  "User-Agent": USER_AGENT,
  "Referer": "https://vidrock.net/",
  "Origin": "https://vidrock.net",
};

// Tercih edilen sunucular (hızlı + çoklu kalite). Diğer İngilizce sunucular da alınır.
const SERVER_PRIORITY = { Nova: 3, Orion: 2, Lyra: 1, Elara: 1 };
const ALLOWED_LANGS = ["english", "original", ""];

function decryptUrl(b64url) {
  let b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const hex = CryptoJS.enc.Base64.parse(b64).toString(CryptoJS.enc.Hex);
  if (hex.length <= (12 + 16) * 2) throw new Error("şifreli veri çok kısa");
  const ivHex = hex.slice(0, 24);
  const ctHex = hex.slice(24, hex.length - 32);
  const out = CryptoJS.AES.decrypt(
    { ciphertext: CryptoJS.enc.Hex.parse(ctHex) },
    CryptoJS.enc.Hex.parse(STREAM_KEY_HEX),
    {
      iv: CryptoJS.enc.Hex.parse(ivHex + "00000002"),
      mode: CryptoJS.mode.CTR,
      padding: CryptoJS.pad.NoPadding,
    }
  );
  return out.toString(CryptoJS.enc.Utf8);
}

function qualityFromPath(url) {
  const m = String(url).match(/[\/_](2160|1080|720|480|360)p?[\/_]/i);
  if (!m) return "Auto";
  return m[1] === "2160" ? "4K" : m[1] + "p";
}

async function expandServer(serverName, url) {
  const text = await safeText(url, { headers: VIDROCK_HEADERS });
  if (!text || text.indexOf("#EXTM3U") === -1) return [];

  const variants = parseM3U8(text, url);
  const label = `Ultra • VidRock ${serverName}`;

  // Master playlist değilse (tek kalite) direkt ekle
  if (variants.length === 0) {
    const q = qualityFromPath(url);
    return [
      {
        name: `${label} ${q}`,
        title: `${q} • İngilizce • HLS (VidRock/${serverName})`,
        url,
        quality: q,
        headers: VIDROCK_HEADERS,
        type: "direct",
        source: "vidrock",
        server: serverName,
        lang: "İngilizce",
        prio: SERVER_PRIORITY[serverName] || 0,
      },
    ];
  }

  // Sunucu sağlığı: en iyi varyantın playlist'i gerçekten açılıyor mu? (Orion bazen 502 verir)
  const top = variants.slice().sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))[0];
  const probe = await safeText(top.url, { headers: VIDROCK_HEADERS });
  if (!probe || probe.indexOf("#EXT") === -1) {
    console.log(`[Ultra/VidRock] ${serverName} varyantları açılmıyor, atlanıyor`);
    return [];
  }

  // Aynı kaliteden yalnızca en yüksek bant genişliklisi
  const best = {};
  variants.forEach((v) => {
    if (!best[v.quality] || (v.bandwidth || 0) > (best[v.quality].bandwidth || 0)) best[v.quality] = v;
  });

  return Object.keys(best).map((q) => ({
    name: `${label} ${q}`,
    title: `${q} • İngilizce • HLS (VidRock/${serverName})`,
    url: best[q].url,
    quality: q,
    headers: VIDROCK_HEADERS,
    type: "direct",
    source: "vidrock",
    server: serverName,
    lang: "İngilizce",
    prio: SERVER_PRIORITY[serverName] || 0,
  }));
}

export async function getVidrockStreams(tmdbId, mediaType, season, episode) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const path = isTv ? `tv/${tmdbId}/${season || 1}/${episode || 1}` : `movie/${tmdbId}`;
  const api = `${BASE}/api/${path}`;
  console.log(`[Ultra/VidRock] ${api}`);

  const data = await fetchJson(api, { headers: VIDROCK_HEADERS });
  if (!data || typeof data !== "object" || data.error) return [];

  const servers = Object.keys(data).filter((k) => {
    const s = data[k];
    if (!s || !s.url) return false;
    const lang = String(s.language || "").toLowerCase();
    return ALLOWED_LANGS.indexOf(lang) !== -1;
  });

  const lists = await Promise.all(
    servers.map((name) => {
      let url;
      try {
        url = decryptUrl(data[name].url);
      } catch (e) {
        return Promise.resolve([]);
      }
      if (!/^https?:\/\//i.test(url)) return Promise.resolve([]);
      // Bir sunucu takılırsa diğerlerini bekletmesin
      return withTimeout(expandServer(name, url), 6000, []);
    })
  );

  const seen = {};
  const out = [];
  lists.forEach((l) =>
    l.forEach((s) => {
      if (seen[s.url]) return;
      seen[s.url] = true;
      out.push(s);
    })
  );
  out.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality) || b.prio - a.prio);
  console.log(`[Ultra/VidRock] ${out.length} direkt link`);
  return out;
}
