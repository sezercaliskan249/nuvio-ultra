/**
 * 4KHDHub - 4K / 1080p MKV direkt linkler (REMUX, DV, HDR)
 *
 * Akış: TMDB başlık+yıl -> 4khdhub arama -> film/dizi sayfası
 *       -> her dosya için HubCloud linki -> R2 / FSL / Google CDN linkleri
 * Not: Dosyalar genelde çift ses (İngilizce + Hindi) içerir; oynatıcıdan
 *      ses parçası İngilizce seçilebilir.
 */

import cheerio from "cheerio-without-node-native";
import { safeText, fetchJson, withTimeout, USER_AGENT } from "../http.js";
import { getMediaInfo } from "../tmdb.js";
import {
  extractHubCloud,
  resolveObfuscatedRedirect,
  describeRelease,
  formatBytes,
  parseBytes,
  kindInfo,
} from "./hubcloud.js";

const DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
const FALLBACK_DOMAIN = "https://4khdhub.one";
const MAX_ITEMS = 12;
let domainCache = { url: null, ts: 0 };

const HEADERS = { "User-Agent": USER_AGENT, Accept: "text/html,*/*" };

async function getDomain() {
  if (domainCache.url && Date.now() - domainCache.ts < 3600000) return domainCache.url;
  try {
    const d = await fetchJson(DOMAINS_URL);
    if (d && d["4khdhub"]) {
      domainCache = { url: d["4khdhub"].replace(/\/+$/, ""), ts: Date.now() };
      return domainCache.url;
    }
  } catch (e) {
    // yut
  }
  return FALLBACK_DOMAIN;
}

function levenshtein(s, t) {
  if (s === t) return 0;
  const n = s.length;
  const m = t.length;
  if (!n) return m;
  if (!m) return n;
  let prev = [];
  for (let j = 0; j <= m; j++) prev[j] = j;
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    for (let j = 1; j <= m; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[m];
}

function normTitle(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\[.*?]/g, "")
    .replace(/[:\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function findPage(domain, title, year, isTv) {
  const url = `${domain}/?s=${encodeURIComponent(title + " " + year)}`;
  const html = await safeText(url, { headers: HEADERS });
  if (!html) return null;
  const $ = cheerio.load(html);
  const want = isTv ? "Series" : "Movies";
  const target = normTitle(title);

  let best = null;
  $(".movie-card").each((_, el) => {
    const fmt = $(el).find(".movie-card-format").text();
    if (fmt.indexOf(want) === -1) return;
    const y = parseInt($(el).find(".movie-card-meta").text(), 10);
    if (isNaN(y) || Math.abs(y - year) > 1) return;
    const t = normTitle($(el).find(".movie-card-title").text());
    const dist = levenshtein(t, target);
    if (dist >= 5) return;
    let href = $(el).attr("href");
    if (!href) return;
    if (!/^https?:/i.test(href)) href = domain + (href[0] === "/" ? "" : "/") + href;
    if (!best || dist < best.dist) best = { href, dist };
  });
  return best ? best.href : null;
}

function qualityFromHeight(h) {
  if (h >= 2160) return "4K";
  if (h >= 1440) return "1440p";
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  return "Auto";
}

async function processItem($, el, pageUrl) {
  const localHtml = $(el).html() || "";
  const fileTitle = $(el).find(".file-title, .episode-file-title").text().trim();
  const sizeMatch = localHtml.match(/([\d.]+ ?[GM]B)/);
  const hMatch = (fileTitle + " " + localHtml).match(/(\d{3,4})p/);
  let height = hMatch ? parseInt(hMatch[1], 10) : 0;
  if (!height && /4k|2160|uhd/i.test(fileTitle)) height = 2160;

  let hub = null;
  $(el)
    .find("a")
    .each((_, a) => {
      const text = $(a).text();
      const href = $(a).attr("href") || "";
      if (!hub && (text.indexOf("HubCloud") !== -1 || /hubcloud[./]/i.test(href))) hub = href;
    });

  if (!hub) {
    // HubDrive -> içindeki HubCloud
    let drive = null;
    $(el)
      .find("a")
      .each((_, a) => {
        const text = $(a).text();
        const href = $(a).attr("href") || "";
        if (!drive && (text.indexOf("HubDrive") !== -1 || /hubdrive[./]/i.test(href))) drive = href;
      });
    if (drive) {
      const resolvedDrive = await resolveObfuscatedRedirect(drive);
      const dh = await safeText(resolvedDrive, { headers: HEADERS });
      if (dh) {
        const $d = cheerio.load(dh);
        $d("a").each((_, a) => {
          const href = $d(a).attr("href") || "";
          if (!hub && ($d(a).text().indexOf("HubCloud") !== -1 || /hubcloud[./]/i.test(href))) hub = href;
        });
      }
    }
  } else {
    hub = await resolveObfuscatedRedirect(hub);
  }
  if (!hub) return [];

  const links = await extractHubCloud(hub, pageUrl);
  const baseBytes = sizeMatch ? parseBytes(sizeMatch[1]) : 0;
  const quality = qualityFromHeight(height);

  return links.map((l) => {
    const name = l.fileTitle || fileTitle;
    const info = describeRelease(name);
    const k = kindInfo(l.kind);
    const size = formatBytes(l.bytes || baseBytes);
    const parts = [quality];
    if (info.tags.length) parts.push(info.tags.join(" "));
    if (size) parts.push(size);
    if (info.langs.length) parts.push("🔊 " + info.langs.join("+"));
    parts.push(k.label);
    return {
      name: `Ultra • 4KHDHub ${quality}`,
      title: parts.join(" • ") + (name ? "\n" + name.slice(0, 120) : ""),
      url: l.url,
      quality,
      size,
      type: "direct",
      source: "4khdhub",
      prio: k.prio,
      kind: l.kind,
      flaky: !!l.flaky,
      bytes: l.bytes || baseBytes || 0,
      fileName: name,
    };
  });
}

export async function get4KHDHubStreams(tmdbId, mediaType, season, episode) {
  const info = await getMediaInfo(tmdbId, mediaType);
  if (!info.title) return [];
  const domain = await getDomain();

  let pageUrl = await findPage(domain, info.title, info.year, info.isTv);
  if (!pageUrl && info.originalTitle && info.originalTitle !== info.title) {
    pageUrl = await findPage(domain, info.originalTitle, info.year, info.isTv);
  }
  if (!pageUrl) {
    console.log("[Ultra/4KHDHub] Sayfa bulunamadı");
    return [];
  }
  console.log(`[Ultra/4KHDHub] ${pageUrl}`);

  const html = await safeText(pageUrl, { headers: HEADERS });
  if (!html) return [];
  const $ = cheerio.load(html);

  const items = [];
  if (info.isTv) {
    const sStr = "S" + String(season || 1).padStart(2, "0");
    const eStr = "Episode-" + String(episode || 1).padStart(2, "0");
    $(".episode-item").each((_, el) => {
      if ($(".episode-title", el).text().indexOf(sStr) === -1) return;
      $(".episode-download-item", el).each((_2, it) => {
        if ($(it).text().indexOf(eStr) !== -1) items.push(it);
      });
    });
  } else {
    $(".download-item").each((_, el) => items.push(el));
  }

  // Hız için: en fazla MAX_ITEMS dosya işle; 4K ve 1080p öncelikli, kalite başına en fazla 4
  const scored = items.map((it) => {
    const txt = $(it).text();
    const h = /2160p|\b4k\b|\buhd\b/i.test(txt) ? 2160 : /1080p/i.test(txt) ? 1080 : /720p/i.test(txt) ? 720 : 480;
    return { it, h };
  });
  scored.sort((a, b) => b.h - a.h);
  const perQ = {};
  const chosen = scored
    .filter((x) => {
      perQ[x.h] = (perQ[x.h] || 0) + 1;
      return perQ[x.h] <= 5;
    })
    .slice(0, MAX_ITEMS)
    .map((x) => x.it);

  const lists = await Promise.all(chosen.map((it) => withTimeout(processItem($, it, pageUrl), 15000, [])));
  const out = [].concat.apply([], lists);
  console.log(`[Ultra/4KHDHub] ${out.length} direkt link`);
  return out;
}
