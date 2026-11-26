/**
 * Vidlink direkt link çıkarıcı (API tabanlı, güvenilir yedek kaynak)
 * Akış:
 *  1) TMDB ID -> enc-dec.app ile şifrele
 *  2) https://vidlink.pro/api/b/movie/{enc} veya /tv/{enc}/{s}/{e}
 *  3) stream.qualities (360/480/720/1080/4K mp4) + stream.playlist (m3u8) parse et
 */

import { fetchJson, makeRequest, USER_AGENT } from "../http.js";
import { parseM3U8, qualityPriority } from "../m3u8.js";

const TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
const ENC_DEC_API = "https://enc-dec.app/api";
const VIDLINK_API = "https://vidlink.pro/api/b";

export const VIDLINK_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "Referer": "https://vidlink.pro/",
  "Origin": "https://vidlink.pro",
  "Accept": "application/json,*/*",
};

function qualityFromKey(key) {
  const s = String(key || "").toLowerCase();
  if (s.includes("2160") || s.includes("4k")) return "4K";
  if (s.includes("1440")) return "1440p";
  if (s.includes("1080")) return "1080p";
  if (s.includes("720")) return "720p";
  if (s.includes("480")) return "480p";
  if (s.includes("360")) return "360p";
  if (s.includes("240")) return "240p";
  const m = s.match(/(\d{3,4})/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 2160) return "4K";
    if (n >= 1080) return "1080p";
    if (n >= 720) return "720p";
    if (n >= 480) return "480p";
    if (n >= 360) return "360p";
  }
  return "Auto";
}

function formatBytes(bytes) {
  const n = parseInt(bytes, 10);
  if (!n || isNaN(n)) return "";
  if (n >= 1073741824) return (n / 1073741824).toFixed(2) + " GB";
  return Math.round(n / 1048576) + " MB";
}

async function encryptTmdbId(tmdbId) {
  const url = `${ENC_DEC_API}/enc-vidlink?text=${tmdbId}`;
  const data = await fetchJson(url, { headers: { "User-Agent": USER_AGENT } });
  if (data && data.result) return data.result;
  throw new Error("Vidlink şifreleme başarısız");
}

async function fetchAndParsePlaylist(playlistUrl) {
  const res = await makeRequest(playlistUrl, { headers: VIDLINK_HEADERS });
  const text = await res.text();
  const variants = parseM3U8(text, playlistUrl);
  if (variants.length === 0) return [];
  variants.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality));
  return variants.map((v) => ({
    name: `Ultra • Vidlink ${v.quality}`,
    title: `${v.quality} - Direkt Link (Vidlink)`,
    url: v.url,
    quality: v.quality,
    headers: VIDLINK_HEADERS,
    type: "direct",
          source: "vidlink",
  }));
}

// Tarayıcı olmayan oynatıcı UA'sı (iOS'ta Nuvio/mpv'nin zaten gönderdiği değer)
const PLAYER_UA = "Lavf/60.3.100";

export async function getVidlinkStreams(tmdbId, mediaType, season, episode) {
  const encrypted = await encryptTmdbId(tmdbId);
  let url;
  if (mediaType === "tv" || mediaType === "series") {
    const s = season || 1;
    const e = episode || 1;
    url = `${VIDLINK_API}/tv/${encrypted}/${s}/${e}`;
  } else {
    url = `${VIDLINK_API}/movie/${encrypted}`;
  }

  console.log(`[Ultra/Vidlink] ${url}`);
  const data = await fetchJson(url, { headers: VIDLINK_HEADERS });

  const streams = [];
  const streamObj = data && data.stream ? data.stream : null;

  // 1) qualities: { "720": { url, ... }, ... }
  if (streamObj && streamObj.qualities) {
    Object.keys(streamObj.qualities).forEach((key) => {
      const q = streamObj.qualities[key];
      if (q && q.url) {
        const quality = qualityFromKey(key);
        const sizeStr = formatBytes(q.size);
        const item = {
          name: `Ultra • Vidlink ${quality}`,
          title: `${quality}${sizeStr ? " • " + sizeStr : ""} - Direkt Link (Vidlink)`,
          url: q.url,
          quality,
          type: "direct",
          source: "vidlink",
        };
        if (sizeStr) item.size = sizeStr;
        // NOT: Bu CDN (hakunaymatata) User-Agent "Mozilla/..." ile başlayınca 428/429 döndürüyor.
        // iPhone'da Nuvio'nun oynatıcısı (mpv) kendi UA'sını ("Lavf/...") gönderdiği için çalışıyor,
        // Android'de ise oynatıcı UA verilmezse Chrome UA'sı ekliyor -> 428. Bu yüzden mpv'nin UA'sını
        // açıkça veriyoruz (iki platformda da test edildi: 206 video/mp4).
        item.headers = q.headers && Object.keys(q.headers).length > 0 ? q.headers : { "User-Agent": PLAYER_UA };
        item.format = /\.m3u8/i.test(q.url) ? "HLS" : "MP4";
        streams.push(item);
      }
    });
  }

  // 2) playlist (m3u8) varsa kaliteleri ayır
  if (streamObj && streamObj.playlist) {
    try {
      const fromPlaylist = await fetchAndParsePlaylist(streamObj.playlist);
      fromPlaylist.forEach((s) => streams.push(s));
    } catch (e) {
      console.log(`[Ultra/Vidlink] Playlist parse hatası: ${e.message}`);
      streams.push({
        name: "Ultra • Vidlink Auto",
        title: "Auto Quality - Direkt Link (Vidlink)",
        url: streamObj.playlist,
        quality: "Auto",
        headers: VIDLINK_HEADERS,
        type: "direct",
          source: "vidlink",
      });
    }
  }

  // 3) data.url fallback
  if (streams.length === 0 && data && data.url) {
    streams.push({
      name: "Ultra • Vidlink Auto",
      title: "Auto Quality - Direkt Link (Vidlink)",
      url: data.url,
      quality: "Auto",
      headers: VIDLINK_HEADERS,
      type: "direct",
          source: "vidlink",
    });
  }

  streams.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality));
  console.log(`[Ultra/Vidlink] ${streams.length} direkt link bulundu`);
  return streams;
}
