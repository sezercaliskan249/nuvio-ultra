/**
 * Vixsrc direkt link çıkarıcı
 * https://vixsrc.to/movie/{tmdbId}
 * https://vixsrc.to/tv/{tmdbId}/{season}/{episode}
 * Sayfadaki window.masterPlaylist veya .m3u8 linkini bulur
 */

import { makeRequest, USER_AGENT } from "../http.js";
import { parseM3U8, qualityPriority } from "../m3u8.js";

export const VIXSRC_BASE = "https://vixsrc.to";

export const VIXSRC_HEADERS = {
  "User-Agent": USER_AGENT,
  "Referer": VIXSRC_BASE + "/",
  "Origin": VIXSRC_BASE,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

function extractMasterPlaylist(html) {
  // 1) window.masterPlaylist = { url: "...", token: "...", expires: "..." }
  if (html.includes("window.masterPlaylist") || html.includes("masterPlaylist")) {
    const urlMatch = html.match(/url:\s*['"]([^'"]+)['"]/);
    const tokenMatch = html.match(/['"]?token['"]?\s*:\s*['"]([^'"]+)['"]/);
    const expiresMatch = html.match(/['"]?expires['"]?\s*:\s*['"]([^'"]+)['"]/);
    if (urlMatch && tokenMatch && expiresMatch) {
      const baseUrl = urlMatch[1];
      const token = tokenMatch[1];
      const expires = expiresMatch[1];
      if (baseUrl.includes("?b=1")) {
        return `${baseUrl}&token=${token}&expires=${expires}&h=1&lang=en`;
      }
      return `${baseUrl}?token=${token}&expires=${expires}&h=1&lang=en`;
    }
  }

  // 2) Direkt .m3u8 linki
  const m3u8Match = html.match(/(https?:\/\/[^'"\s]+\.m3u8[^'"\s]*)/);
  if (m3u8Match) return m3u8Match[1];

  // 3) Script içindeki playlist linki
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    const inner = m[1];
    const sm = inner.match(/['"]?(https?:\/\/[^'"\s]+(?:\.m3u8|playlist)[^'"\s]*)/);
    if (sm) return sm[1];
  }

  return null;
}

/**
 * Vixsrc'den direkt HTTP stream'leri getirir
 * Döner: [{ name, title, url, quality, headers, type: "direct", source: "vixsrc" }]
 */
export async function getVixsrcStreams(tmdbId, mediaType, season, episode) {
  let pageUrl;
  if (mediaType === "tv" || mediaType === "series") {
    const s = season || 1;
    const e = episode || 1;
    pageUrl = `${VIXSRC_BASE}/tv/${tmdbId}/${s}/${e}`;
  } else {
    pageUrl = `${VIXSRC_BASE}/movie/${tmdbId}`;
  }

  console.log(`[Ultra/Vixsrc] Sayfa: ${pageUrl}`);

  const res = await makeRequest(pageUrl, { headers: VIXSRC_HEADERS });
  const html = await res.text();

  const masterUrl = extractMasterPlaylist(html);
  if (!masterUrl) {
    console.log("[Ultra/Vixsrc] Master playlist bulunamadı");
    return [];
  }

  console.log(`[Ultra/Vixsrc] Master: ${masterUrl.substring(0, 90)}...`);

  // Master playlist'i çekip kaliteleri ayır
  try {
    const mRes = await makeRequest(masterUrl, { headers: VIXSRC_HEADERS });
    const m3u8Text = await mRes.text();
    const variants = parseM3U8(m3u8Text, masterUrl);

    if (variants.length === 0) {
      // Tek kalite - master'ı direkt dön
      return [
        {
          name: "Ultra • Vixsrc",
          title: "Auto Quality",
          url: masterUrl,
          quality: "Auto",
          headers: VIXSRC_HEADERS,
          type: "direct", source: "vixsrc",
        },
      ];
    }

    // Kaliteye göre sırala: 4K > 1080p > 720p
    variants.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality));

    return variants.map((v) => ({
      name: `Ultra • Vixsrc ${v.quality}`,
      title: `${v.quality} - Direkt Link`,
      url: v.url,
      quality: v.quality,
      headers: VIXSRC_HEADERS,
      type: "direct", source: "vixsrc",
    }));
  } catch (e) {
    console.log(`[Ultra/Vixsrc] M3U8 parse hatası: ${e.message}, master dönülüyor`);
    return [
      {
        name: "Ultra • Vixsrc",
        title: "Auto Quality",
        url: masterUrl,
        quality: "Auto",
        headers: VIXSRC_HEADERS,
        type: "direct", source: "vixsrc",
      },
    ];
  }
}
