/**
 * Torrent çıkarıcı - Torrentio API tabanlı
 * https://torrentio.strem.fun/stream/movie/{imdbId}.json
 * https://torrentio.strem.fun/stream/series/{imdbId}:{season}:{episode}.json
 *
 * Torrentio 25+ torrent sitesini (YTS, EZTV, 1337x, TPB...) tarar ve
 * 4K / 1080p / 720p torrentleri seed + boyut bilgisiyle döner.
 * Magnet linkler üretilir. Nuvio'da oynaması için debrid (Real-Debrid/TorBox)
 * veya harici torrent istemcisi gerekir - bkz. README.
 */

import { fetchJson, USER_AGENT } from "../http.js";
import { getMediaInfo } from "../tmdb.js";

const TORRENTIO_BASE = "https://torrentio.strem.fun";

function normalizeQuality(raw) {
  if (!raw) return "Unknown";
  const s = String(raw).toLowerCase();
  if (s.includes("4320") || s.includes("8k")) return "4K";
  if (s.includes("2160") || s.includes("4k") || s.includes("uhd")) return "4K";
  if (s.includes("1440") || s.includes("2k")) return "1440p";
  if (s.includes("1080") || s.includes("fhd")) return "1080p";
  if (s.includes("720") || s.includes("hd")) return "720p";
  if (s.includes("480")) return "480p";
  if (s.includes("360")) return "360p";
  const m = s.match(/(\d{3,4})p?/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 2160) return "4K";
    if (n >= 1080) return "1080p";
    if (n >= 720) return "720p";
  }
  return String(raw).toUpperCase();
}

function buildMagnet(infoHash, filename, sources) {
  let magnet = `magnet:?xt=urn:btih:${infoHash}`;
  if (filename) magnet += `&dn=${encodeURIComponent(filename)}`;
  const trackers = [];
  if (Array.isArray(sources)) {
    sources.forEach((src) => {
      if (typeof src === "string" && src.startsWith("tracker:")) {
        trackers.push(src.substring(8));
      }
    });
  }
  if (trackers.length === 0) {
    trackers.push(
      "udp://open.stealth.si:80/announce",
      "udp://tracker.opentrackr.org:1337/announce",
      "udp://tracker.torrent.eu.org:451/announce",
      "udp://tracker.dler.org:6969/announce"
    );
  }
  trackers.slice(0, 10).forEach((t) => {
    magnet += `&tr=${encodeURIComponent(t)}`;
  });
  return magnet;
}

function parseSeeds(title) {
  if (!title) return 0;
  const m = String(title).match(/👤\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

function parseSize(title) {
  if (!title) return "";
  const m = String(title).match(/💾\s*([0-9.]+\s*(?:GB|MB|TB))/i);
  return m ? m[1] : "";
}

function parseTracker(title) {
  if (!title) return "";
  const m = String(title).match(/⚙️\s*([^\n]+)/);
  return m ? m[1].trim() : "";
}

/**
 * Torrentio'dan torrent stream'leri getirir
 */
export async function getTorrentStreams(tmdbId, mediaType, season, episode) {
  const info = await getMediaInfo(tmdbId, mediaType);
  if (!info.imdbId) {
    console.log("[Ultra/Torrentio] IMDb ID bulunamadı, torrent atlanıyor");
    return [];
  }

  let url;
  if (mediaType === "tv" || mediaType === "series") {
    const s = season || 1;
    const e = episode || 1;
    url = `${TORRENTIO_BASE}/stream/series/${info.imdbId}:${s}:${e}.json`;
  } else {
    url = `${TORRENTIO_BASE}/stream/movie/${info.imdbId}.json`;
  }

  console.log(`[Ultra/Torrentio] ${url}`);
  const data = await fetchJson(url, { headers: { "User-Agent": USER_AGENT } });
  const rawStreams = (data && data.streams) || [];
  console.log(`[Ultra/Torrentio] ${rawStreams.length} torrent bulundu`);

  const streams = [];
  rawStreams.forEach((s) => {
    if (!s.infoHash) return;
    const quality = normalizeQuality(s.name || s.title);
    const filename =
      (s.behaviorHints && s.behaviorHints.filename) || s.title || "";
    const seeds = parseSeeds(s.title);
    const size = parseSize(s.title);
    const tracker = parseTracker(s.title);
    const magnet = buildMagnet(s.infoHash, filename, s.sources);

    // Torrentio başlığı: 1. satır = sürüm adı, sonra 👤 seed 💾 boyut ⚙️ site, en sonda bayraklar
    const lines = String(s.title || "").split("\n");
    const releaseName = lines[0] || filename;
    const flagLine = lines.filter((l) => /\uD83C[\uDDE6-\uDDFF]/.test(l)).pop() || "";
    const nameTags = String(s.name || "").split("\n").slice(1).join(" "); // ör. "4k DV | HDR"

    streams.push({
      name: `Ultra • Torrent ${quality}`,
      title: releaseName,
      tracker,
      fileName: releaseName,
      extraTags: nameTags,
      flags: flagLine.trim(),
      url: magnet,
      quality,
      size,
      type: "torrent",
      source: "torrentio",
      infoHash: s.infoHash,
      seeds,
    });
  });

  // Seed sayısına göre sırala (çok seed = hızlı)
  streams.sort((a, b) => (b.seeds || 0) - (a.seeds || 0));
  return streams;
}
