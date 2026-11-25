/**
 * MoviesDrive - 720p / 1080p / 4K MKV direkt linkler (IMDb ID ile arama)
 *
 * Akış: IMDb ID -> {domain}/search.php?q=tt... -> sayfa -> mdrive linkleri
 *       -> HubCloud -> R2 / FSL / ZipDisk linkleri
 * ZipDisk linkleri Google Drive kotasına takılabildiği için her link
 * 1 byte'lık istekle doğrulanır; çalışmayanlar listeye girmez.
 */

import cheerio from "cheerio-without-node-native";
import { safeText, fetchJson, withTimeout, USER_AGENT } from "../http.js";
import { getMediaInfo } from "../tmdb.js";
import { extractHubCloud, describeRelease, formatBytes, kindInfo } from "./hubcloud.js";

const DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
const FALLBACK = "https://new4.moviesdrive.cyou";
let cached = null;

const HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function getMainUrl() {
  if (cached) return cached;
  try {
    const d = await fetchJson(DOMAINS_URL);
    cached = (d && d.moviesdrive ? d.moviesdrive : FALLBACK).replace(/\/+$/, "");
  } catch (e) {
    cached = FALLBACK;
  }
  return cached;
}

async function hubLinksFromMdrive(url) {
  const html = await safeText(url, { headers: HEADERS });
  if (!html) return [];

  // Yeni tip: hubcloud.xxx/drive/search-recover.php?from_ac=...&q=...
  // Sayfadaki Q_INITIAL + FROM_AC_TOKEN ile JSON API'den hubcloud linkleri alınır
  if (url.indexOf("search-recover.php") !== -1) {
    const q = html.match(/const Q_INITIAL\s*=\s*"([^"]+)"/);
    const tok = html.match(/const FROM_AC_TOKEN\s*=\s*"([^"]+)"/);
    if (q && tok) {
      const api =
        url.split("?")[0] +
        "?api=search&q=" + encodeURIComponent(q[1]) +
        "&page=1&from_ac=" + encodeURIComponent(tok[1]);
      try {
        const data = await fetchJson(api, { headers: { ...HEADERS, Accept: "application/json" } });
        if (data && data.hits) {
          return data.hits.map((h) => h.url).filter((u) => !!u);
        }
      } catch (e) {
        // yut
      }
    }
    return [];
  }

  const $ = cheerio.load(html);
  const out = [];
  $("a[href]").each((_, el) => {
    const h = $(el).attr("href");
    if (/hubcloud/i.test(h) && out.indexOf(h) === -1) out.push(h);
  });
  return out;
}

function qualityFrom(text) {
  const m = String(text).match(/(2160|1080|720|480)p/i);
  if (m) return m[1] === "2160" ? "4K" : m[1] + "p";
  if (/4k|uhd/i.test(text)) return "4K";
  return "1080p";
}

export async function getMoviesDriveStreams(tmdbId, mediaType, season, episode) {
  const info = await getMediaInfo(tmdbId, mediaType);
  if (!info.imdbId) return [];
  const main = await getMainUrl();

  const search = await fetchJson(`${main}/search.php?q=${info.imdbId}`, { headers: HEADERS });
  const hit =
    search && search.hits
      ? search.hits.map((h) => h.document).find((d) => d && d.imdb_id === info.imdbId)
      : null;
  if (!hit) {
    console.log("[Ultra/MoviesDrive] Bulunamadı");
    return [];
  }
  const pageUrl = /^https?:/.test(hit.permalink) ? hit.permalink : main + hit.permalink;
  const html = await safeText(pageUrl, { headers: HEADERS });
  if (!html) return [];
  const $ = cheerio.load(html);

  let hubUrls = [];
  if (!info.isTv) {
    // Hız için: en fazla 8 kalite sayfası, 4K/1080p öncelikli, 480p ve altı atlanır
    const cands = [];
    $("h5 > a").each((_, el) => {
      const h = $(el).attr("href");
      const t = ($(el).text() || $(el).parent().text()).toLowerCase();
      const score = /2160p|\b4k\b|\buhd\b/.test(t) ? 3 : /1080p/.test(t) ? 2 : /720p/.test(t) ? 1 : /480p|360p/.test(t) ? -1 : 0;
      if (h && score >= 0 && !cands.some((c) => c.h === h)) cands.push({ h, score });
    });
    cands.sort((x, y) => y.score - x.score);
    const mdrive = cands.slice(0, 8).map((c) => c.h);
    const lists = await Promise.all(mdrive.map((u) => hubLinksFromMdrive(u).catch(() => [])));
    lists.forEach((l) => (hubUrls = hubUrls.concat(l)));
  } else {
    const sRe = new RegExp("Season\\s*" + (season || 1) + "\\b", "i");
    const ep = episode || 1;
    const eRe = new RegExp("Ep\\s*0?" + ep + "\\b", "i");
    const seasonPages = [];
    $("h5").each((_, el) => {
      if (!sRe.test($(el).text())) return;
      const h = $(el).next().find("a").attr("href");
      if (h) seasonPages.push(h);
    });
    const lists = await Promise.all(
      seasonPages.map(async (sp) => {
        const sh = await safeText(sp, { headers: HEADERS });
        if (!sh) return [];
        const $s = cheerio.load(sh);
        const found = [];
        $s("h5").each((_, el) => {
          if (!eRe.test($s(el).text())) return;
          const a1 = $s(el).next().find("a").attr("href");
          const a2 = $s(el).next().next().find("a").attr("href");
          [a1, a2].forEach((a) => {
            if (a && /hubcloud/i.test(a)) found.push(a);
          });
        });
        return found;
      })
    );
    lists.forEach((l) => (hubUrls = hubUrls.concat(l)));
  }

  hubUrls = hubUrls.filter((u, i) => hubUrls.indexOf(u) === i);
  const extracted = await Promise.all(hubUrls.map((u) => withTimeout(extractHubCloud(u, pageUrl), 15000, [])));
  const links = [].concat.apply([], extracted);

  // (Ölü / kotası dolmuş linkler extractHubCloud içinde zaten ayıklandı)

  const out = links.map((l) => {
    const quality = qualityFrom(l.fileTitle);
    const d = describeRelease(l.fileTitle);
    const k = kindInfo(l.kind);
    const size = formatBytes(l.bytes);
    const parts = [quality];
    if (d.tags.length) parts.push(d.tags.join(" "));
    if (size) parts.push(size);
    if (d.langs.length) parts.push("🔊 " + d.langs.join("+"));
    parts.push(k.label);
    return {
      name: `Ultra • MoviesDrive ${quality}`,
      title: parts.join(" • ") + (l.fileTitle ? "\n" + l.fileTitle.slice(0, 120) : ""),
      url: l.url,
      quality,
      size,
      type: "direct",
      source: "moviesdrive",
      prio: k.prio,
      kind: l.kind,
      flaky: !!l.flaky,
      bytes: l.bytes || 0,
      fileName: l.fileTitle,
    };
  });
  console.log(`[Ultra/MoviesDrive] ${out.length} çalışan direkt link`);
  return out;
}
