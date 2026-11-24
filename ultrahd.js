/**
 * ultrahd - src/ultrahd/ altından üretildi
 * Tarih: 2026-11-24T10:17:57.030Z
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/ultra/sources/fourkhdhub.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));

// src/ultra/http.js
var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
var DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "application/json,text/html,*/*",
  "Accept-Language": "en-US,en;q=0.9,tr;q=0.8"
};
function withTimeout(promise, ms, fallback) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(fallback);
      }
    }, ms);
    Promise.resolve(promise).then(
      (v) => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(v);
        }
      },
      () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      }
    );
  });
}
function makeRequest(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const headers = __spreadValues(__spreadValues({}, DEFAULT_HEADERS), options.headers || {});
    const response = yield fetch(url, __spreadProps(__spreadValues({}, options), {
      method: options.method || "GET",
      headers
    }));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${url}`);
    }
    return response;
  });
}
function fetchJson(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    const res = yield makeRequest(url, options);
    return yield res.json();
  });
}
function safeText(_0) {
  return __async(this, arguments, function* (url, options = {}) {
    try {
      const res = yield fetch(url, __spreadProps(__spreadValues({}, options), {
        headers: __spreadValues(__spreadValues({}, DEFAULT_HEADERS), options.headers || {})
      }));
      if (!res.ok)
        return null;
      return yield res.text();
    } catch (e) {
      return null;
    }
  });
}
function resolveFinalUrl(_0) {
  return __async(this, arguments, function* (url, headers = {}) {
    try {
      const res = yield fetch(url, {
        method: "HEAD",
        headers: __spreadValues({ "User-Agent": USER_AGENT }, headers)
      });
      return res.url || url;
    } catch (e) {
      return null;
    }
  });
}
var RANGE_SAFE_HOSTS = /(\.workers\.dev|r2\.cloudflarestorage\.com|\.r2\.dev)(\/|:|$)/i;
function canProbe(url) {
  const m = String(url).match(/^https?:\/\/([^/?#]+)/i);
  return !!(m && RANGE_SAFE_HOSTS.test(m[1] + "/"));
}
function isPlayable(url, headers = {}, ms = 4e3) {
  if (!canProbe(url))
    return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => {
      if (ac) {
        try {
          ac.abort();
        } catch (e) {
        }
      }
      finish(true);
    }, ms);
    const opts = {
      method: "GET",
      headers: __spreadValues({ "User-Agent": "ExoPlayerLib/2.19.1", Range: "bytes=0-0" }, headers)
    };
    if (ac)
      opts.signal = ac.signal;
    fetch(url, opts).then((res) => {
      clearTimeout(timer);
      if (res.status !== 200 && res.status !== 206)
        return finish(false);
      const ct = res.headers && res.headers.get && res.headers.get("content-type") || "";
      finish(!/text\/html|application\/json|text\/plain/i.test(ct));
      try {
        if (res.body && res.body.cancel)
          res.body.cancel();
      } catch (e) {
      }
    }).catch(() => {
      clearTimeout(timer);
      finish(done ? true : false);
    });
  });
}
function safeUrl(url) {
  if (!url)
    return url;
  if (/[\s\[\]]/.test(url)) {
    try {
      return encodeURI(decodeURI(url));
    } catch (e) {
      return url.replace(/ /g, "%20");
    }
  }
  return url;
}

// src/ultra/tmdb.js
var TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
var cache = {};
function getMediaInfo(tmdbId, mediaType) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const key = (isTv ? "tv" : "movie") + ":" + tmdbId;
  if (cache[key])
    return cache[key];
  const endpoint = isTv ? "tv" : "movie";
  const url = `https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
  const p = fetchJson(url).then((data) => {
    const dateStr = isTv ? data.first_air_date : data.release_date;
    return {
      title: isTv ? data.name : data.title,
      originalTitle: isTv ? data.original_name : data.original_title,
      year: dateStr ? parseInt(dateStr.substring(0, 4), 10) : 0,
      imdbId: data.external_ids && data.external_ids.imdb_id || data.imdb_id || null,
      isTv
    };
  }).catch((e) => {
    delete cache[key];
    throw e;
  });
  cache[key] = p;
  return p;
}

// src/ultra/sources/hubcloud.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var HTML_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};
function atobSafe(input) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const str = String(input).replace(/=+$/, "");
  let output = "";
  for (let bc = 0, bs, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}
function rot13(str) {
  return str.replace(
    /[a-zA-Z]/g,
    (c) => String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
  );
}
function parseBytes(val) {
  if (typeof val === "number")
    return val;
  if (!val)
    return 0;
  const m = String(val).match(/([0-9.]+)\s*([KMGT]?B)/i);
  if (!m)
    return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  const mul = u[0] === "T" ? 1099511627776 : u[0] === "G" ? 1073741824 : u[0] === "M" ? 1048576 : u[0] === "K" ? 1024 : 1;
  return n * mul;
}
function formatBytes(b) {
  if (!b)
    return "";
  if (b >= 1073741824)
    return (b / 1073741824).toFixed(2) + " GB";
  return Math.round(b / 1048576) + " MB";
}
function describeRelease(title) {
  const t = String(title || "");
  const tags = [];
  if (/remux/i.test(t))
    tags.push("REMUX");
  else if (/blu-?ray/i.test(t))
    tags.push("BluRay");
  else if (/web-?dl/i.test(t))
    tags.push("WEB-DL");
  else if (/webrip/i.test(t))
    tags.push("WEBRip");
  const hdr = [];
  if (/\bDV\b|dolby.?vision/i.test(t))
    hdr.push("DV");
  if (/HDR10\+/i.test(t))
    hdr.push("HDR10+");
  else if (/HDR/i.test(t))
    hdr.push("HDR");
  if (hdr.length)
    tags.push(hdr.join(" "));
  if (/x265|hevc|h\.?265/i.test(t))
    tags.push("HEVC");
  if (/atmos/i.test(t))
    tags.push("Atmos");
  const langs = [];
  if (/english|\beng\b/i.test(t))
    langs.push("EN");
  if (/hindi/i.test(t))
    langs.push("Hindi");
  if (/tamil/i.test(t))
    langs.push("Tamil");
  if (/telugu/i.test(t))
    langs.push("Telugu");
  return { tags, langs };
}
function resolveObfuscatedRedirect(url) {
  return __async(this, null, function* () {
    if (/hubcloud\.|hubdrive\./i.test(url))
      return url;
    const html = yield safeText(url, { headers: HTML_HEADERS });
    if (!html)
      return url;
    try {
      const m = html.match(/'o','(.*?)'/);
      if (!m)
        return url;
      const data = JSON.parse(atobSafe(rot13(atobSafe(atobSafe(m[1])))));
      if (data && data.o)
        return atobSafe(data.o);
    } catch (e) {
    }
    return url;
  });
}
function classify(text, href) {
  const tx = text.toLowerCase();
  if (/10gbps|pixelserver/i.test(text) || /pixel\.hubcloud|hubcloud\.cx/i.test(href))
    return "PIXEL";
  if (tx.indexOf("fsl") !== -1)
    return "FSL";
  if (tx.indexOf("zipdisk") !== -1)
    return "ZIPDISK";
  if (tx.indexOf("download file") !== -1 || /r2\.dev/i.test(href))
    return "R2";
  if (/workers\.dev/i.test(href))
    return "ZIPDISK";
  if (tx.indexOf("s3 server") !== -1)
    return "S3";
  return null;
}
function resolvePixel(url) {
  return __async(this, null, function* () {
    const final = yield resolveFinalUrl(url, { Referer: url });
    if (!final)
      return null;
    const m = final.match(/[?&]link=([^&]+)/);
    if (m) {
      try {
        return decodeURIComponent(m[1]);
      } catch (e) {
        return m[1];
      }
    }
    if (/googleusercontent\.com|googlevideo\.com/i.test(final))
      return final;
    return null;
  });
}
function extractHubCloud(hubUrl, referer) {
  return __async(this, null, function* () {
    if (!hubUrl)
      return [];
    let pageUrl = hubUrl.replace("hubcloud.ink", "hubcloud.dad");
    let html = yield safeText(pageUrl, { headers: __spreadProps(__spreadValues({}, HTML_HEADERS), { Referer: referer || pageUrl }) });
    if (!html)
      return [];
    if (pageUrl.indexOf("hubcloud.php") === -1) {
      let next = "";
      const $first = import_cheerio_without_node_native.default.load(html);
      const btn = $first("#download").attr("href");
      if (btn)
        next = btn;
      else {
        const m = html.match(/var url ?= ?'(.*?)'/);
        if (m)
          next = m[1];
      }
      if (next) {
        if (!/^https?:/i.test(next)) {
          const host = pageUrl.match(/^(https?:\/\/[^/]+)/);
          next = (host ? host[1] : "") + "/" + next.replace(/^\//, "");
        }
        const html2 = yield safeText(next, { headers: __spreadProps(__spreadValues({}, HTML_HEADERS), { Referer: pageUrl }) });
        if (html2) {
          html = html2;
          pageUrl = next;
        }
      }
    }
    const $ = import_cheerio_without_node_native.default.load(html);
    const bytes = parseBytes($("#size").text() || $("i#size").text());
    const fileTitle = ($("div.card-header").text() || $("title").text() || "").trim();
    const raw = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || !/^https?:/i.test(href))
        return;
      const kind = classify($(el).text().trim(), href);
      if (kind)
        raw.push({ kind, url: href });
    });
    const resolved = yield Promise.all(
      raw.map((r) => {
        if (r.kind !== "PIXEL")
          return Promise.resolve(__spreadProps(__spreadValues({}, r), { url: safeUrl(r.url) }));
        return resolvePixel(r.url).then((g) => g ? __spreadProps(__spreadValues({}, r), { url: g }) : null);
      })
    );
    const seen = {};
    const unique = resolved.filter((r) => r && r.url && !seen[r.url] && (seen[r.url] = true));
    const checks = yield Promise.all(
      unique.map((r) => r.kind === "PIXEL" ? Promise.resolve(true) : isPlayable(r.url, {}, 3500))
    );
    return unique.filter((_, i) => checks[i]).map((r) => __spreadProps(__spreadValues({}, r), { bytes, fileTitle }));
  });
}
function kindInfo(kind) {
  switch (kind) {
    case "R2":
      return { label: "\u26A1 Direkt", prio: 5 };
    case "FSL":
      return { label: "\u26A1 FSL", prio: 4 };
    case "PIXEL":
      return { label: "\u{1F680} Google CDN (ileri sarma s\u0131n\u0131rl\u0131)", prio: 2 };
    case "S3":
      return { label: "S3", prio: 3 };
    case "ZIPDISK":
      return { label: "ZipDisk", prio: 1 };
    default:
      return { label: kind, prio: 0 };
  }
}

// src/ultra/sources/fourkhdhub.js
var DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
var FALLBACK_DOMAIN = "https://4khdhub.one";
var MAX_ITEMS = 12;
var domainCache = { url: null, ts: 0 };
var HEADERS = { "User-Agent": USER_AGENT, Accept: "text/html,*/*" };
function getDomain() {
  return __async(this, null, function* () {
    if (domainCache.url && Date.now() - domainCache.ts < 36e5)
      return domainCache.url;
    try {
      const d = yield fetchJson(DOMAINS_URL);
      if (d && d["4khdhub"]) {
        domainCache = { url: d["4khdhub"].replace(/\/+$/, ""), ts: Date.now() };
        return domainCache.url;
      }
    } catch (e) {
    }
    return FALLBACK_DOMAIN;
  });
}
function levenshtein(s, t) {
  if (s === t)
    return 0;
  const n = s.length;
  const m = t.length;
  if (!n)
    return m;
  if (!m)
    return n;
  let prev = [];
  for (let j = 0; j <= m; j++)
    prev[j] = j;
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
  return String(s || "").toLowerCase().replace(/\[.*?]/g, "").replace(/[:\-–—]/g, " ").replace(/\s+/g, " ").trim();
}
function findPage(domain, title, year, isTv) {
  return __async(this, null, function* () {
    const url = `${domain}/?s=${encodeURIComponent(title + " " + year)}`;
    const html = yield safeText(url, { headers: HEADERS });
    if (!html)
      return null;
    const $ = import_cheerio_without_node_native2.default.load(html);
    const want = isTv ? "Series" : "Movies";
    const target = normTitle(title);
    let best = null;
    $(".movie-card").each((_, el) => {
      const fmt = $(el).find(".movie-card-format").text();
      if (fmt.indexOf(want) === -1)
        return;
      const y = parseInt($(el).find(".movie-card-meta").text(), 10);
      if (isNaN(y) || Math.abs(y - year) > 1)
        return;
      const t = normTitle($(el).find(".movie-card-title").text());
      const dist = levenshtein(t, target);
      if (dist >= 5)
        return;
      let href = $(el).attr("href");
      if (!href)
        return;
      if (!/^https?:/i.test(href))
        href = domain + (href[0] === "/" ? "" : "/") + href;
      if (!best || dist < best.dist)
        best = { href, dist };
    });
    return best ? best.href : null;
  });
}
function qualityFromHeight(h) {
  if (h >= 2160)
    return "4K";
  if (h >= 1440)
    return "1440p";
  if (h >= 1080)
    return "1080p";
  if (h >= 720)
    return "720p";
  if (h >= 480)
    return "480p";
  return "Auto";
}
function processItem($, el, pageUrl) {
  return __async(this, null, function* () {
    const localHtml = $(el).html() || "";
    const fileTitle = $(el).find(".file-title, .episode-file-title").text().trim();
    const sizeMatch = localHtml.match(/([\d.]+ ?[GM]B)/);
    const hMatch = (fileTitle + " " + localHtml).match(/(\d{3,4})p/);
    let height = hMatch ? parseInt(hMatch[1], 10) : 0;
    if (!height && /4k|2160|uhd/i.test(fileTitle))
      height = 2160;
    let hub = null;
    $(el).find("a").each((_, a) => {
      const text = $(a).text();
      const href = $(a).attr("href") || "";
      if (!hub && (text.indexOf("HubCloud") !== -1 || /hubcloud[./]/i.test(href)))
        hub = href;
    });
    if (!hub) {
      let drive = null;
      $(el).find("a").each((_, a) => {
        const text = $(a).text();
        const href = $(a).attr("href") || "";
        if (!drive && (text.indexOf("HubDrive") !== -1 || /hubdrive[./]/i.test(href)))
          drive = href;
      });
      if (drive) {
        const resolvedDrive = yield resolveObfuscatedRedirect(drive);
        const dh = yield safeText(resolvedDrive, { headers: HEADERS });
        if (dh) {
          const $d = import_cheerio_without_node_native2.default.load(dh);
          $d("a").each((_, a) => {
            const href = $d(a).attr("href") || "";
            if (!hub && ($d(a).text().indexOf("HubCloud") !== -1 || /hubcloud[./]/i.test(href)))
              hub = href;
          });
        }
      }
    } else {
      hub = yield resolveObfuscatedRedirect(hub);
    }
    if (!hub)
      return [];
    const links = yield extractHubCloud(hub, pageUrl);
    const baseBytes = sizeMatch ? parseBytes(sizeMatch[1]) : 0;
    const quality = qualityFromHeight(height);
    return links.map((l) => {
      const name = l.fileTitle || fileTitle;
      const info = describeRelease(name);
      const k = kindInfo(l.kind);
      const size = formatBytes(l.bytes || baseBytes);
      const parts = [quality];
      if (info.tags.length)
        parts.push(info.tags.join(" "));
      if (size)
        parts.push(size);
      if (info.langs.length)
        parts.push("\u{1F50A} " + info.langs.join("+"));
      parts.push(k.label);
      return {
        name: `Ultra \u2022 4KHDHub ${quality}`,
        title: parts.join(" \u2022 ") + (name ? "\n" + name.slice(0, 120) : ""),
        url: l.url,
        quality,
        size,
        type: "direct",
        source: "4khdhub",
        prio: k.prio,
        kind: l.kind,
        fileName: name
      };
    });
  });
}
function get4KHDHubStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const info = yield getMediaInfo(tmdbId, mediaType);
    if (!info.title)
      return [];
    const domain = yield getDomain();
    let pageUrl = yield findPage(domain, info.title, info.year, info.isTv);
    if (!pageUrl && info.originalTitle && info.originalTitle !== info.title) {
      pageUrl = yield findPage(domain, info.originalTitle, info.year, info.isTv);
    }
    if (!pageUrl) {
      console.log("[Ultra/4KHDHub] Sayfa bulunamad\u0131");
      return [];
    }
    console.log(`[Ultra/4KHDHub] ${pageUrl}`);
    const html = yield safeText(pageUrl, { headers: HEADERS });
    if (!html)
      return [];
    const $ = import_cheerio_without_node_native2.default.load(html);
    const items = [];
    if (info.isTv) {
      const sStr = "S" + String(season || 1).padStart(2, "0");
      const eStr = "Episode-" + String(episode || 1).padStart(2, "0");
      $(".episode-item").each((_, el) => {
        if ($(".episode-title", el).text().indexOf(sStr) === -1)
          return;
        $(".episode-download-item", el).each((_2, it) => {
          if ($(it).text().indexOf(eStr) !== -1)
            items.push(it);
        });
      });
    } else {
      $(".download-item").each((_, el) => items.push(el));
    }
    const scored = items.map((it) => {
      const txt = $(it).text();
      const h = /2160p|\b4k\b|\buhd\b/i.test(txt) ? 2160 : /1080p/i.test(txt) ? 1080 : /720p/i.test(txt) ? 720 : 480;
      return { it, h };
    });
    scored.sort((a, b) => b.h - a.h);
    const perQ = {};
    const chosen = scored.filter((x) => {
      perQ[x.h] = (perQ[x.h] || 0) + 1;
      return perQ[x.h] <= 5;
    }).slice(0, MAX_ITEMS).map((x) => x.it);
    const lists = yield Promise.all(chosen.map((it) => withTimeout(processItem($, it, pageUrl), 15e3, [])));
    const out = [].concat.apply([], lists);
    console.log(`[Ultra/4KHDHub] ${out.length} direkt link`);
    return out;
  });
}

// src/ultra/sources/moviesdrive.js
var import_cheerio_without_node_native3 = __toESM(require("cheerio-without-node-native"));
var DOMAINS_URL2 = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
var FALLBACK = "https://new4.moviesdrive.cyou";
var cached = null;
var HEADERS2 = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9"
};
function getMainUrl() {
  return __async(this, null, function* () {
    if (cached)
      return cached;
    try {
      const d = yield fetchJson(DOMAINS_URL2);
      cached = (d && d.moviesdrive ? d.moviesdrive : FALLBACK).replace(/\/+$/, "");
    } catch (e) {
      cached = FALLBACK;
    }
    return cached;
  });
}
function hubLinksFromMdrive(url) {
  return __async(this, null, function* () {
    const html = yield safeText(url, { headers: HEADERS2 });
    if (!html)
      return [];
    if (url.indexOf("search-recover.php") !== -1) {
      const q = html.match(/const Q_INITIAL\s*=\s*"([^"]+)"/);
      const tok = html.match(/const FROM_AC_TOKEN\s*=\s*"([^"]+)"/);
      if (q && tok) {
        const api = url.split("?")[0] + "?api=search&q=" + encodeURIComponent(q[1]) + "&page=1&from_ac=" + encodeURIComponent(tok[1]);
        try {
          const data = yield fetchJson(api, { headers: __spreadProps(__spreadValues({}, HEADERS2), { Accept: "application/json" }) });
          if (data && data.hits) {
            return data.hits.map((h) => h.url).filter((u) => !!u);
          }
        } catch (e) {
        }
      }
      return [];
    }
    const $ = import_cheerio_without_node_native3.default.load(html);
    const out = [];
    $("a[href]").each((_, el) => {
      const h = $(el).attr("href");
      if (/hubcloud/i.test(h) && out.indexOf(h) === -1)
        out.push(h);
    });
    return out;
  });
}
function qualityFrom(text) {
  const m = String(text).match(/(2160|1080|720|480)p/i);
  if (m)
    return m[1] === "2160" ? "4K" : m[1] + "p";
  if (/4k|uhd/i.test(text))
    return "4K";
  return "1080p";
}
function getMoviesDriveStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const info = yield getMediaInfo(tmdbId, mediaType);
    if (!info.imdbId)
      return [];
    const main = yield getMainUrl();
    const search = yield fetchJson(`${main}/search.php?q=${info.imdbId}`, { headers: HEADERS2 });
    const hit = search && search.hits ? search.hits.map((h) => h.document).find((d) => d && d.imdb_id === info.imdbId) : null;
    if (!hit) {
      console.log("[Ultra/MoviesDrive] Bulunamad\u0131");
      return [];
    }
    const pageUrl = /^https?:/.test(hit.permalink) ? hit.permalink : main + hit.permalink;
    const html = yield safeText(pageUrl, { headers: HEADERS2 });
    if (!html)
      return [];
    const $ = import_cheerio_without_node_native3.default.load(html);
    let hubUrls = [];
    if (!info.isTv) {
      const cands = [];
      $("h5 > a").each((_, el) => {
        const h = $(el).attr("href");
        const t = ($(el).text() || $(el).parent().text()).toLowerCase();
        const score = /2160p|\b4k\b|\buhd\b/.test(t) ? 3 : /1080p/.test(t) ? 2 : /720p/.test(t) ? 1 : /480p|360p/.test(t) ? -1 : 0;
        if (h && score >= 0 && !cands.some((c) => c.h === h))
          cands.push({ h, score });
      });
      cands.sort((x, y) => y.score - x.score);
      const mdrive = cands.slice(0, 8).map((c) => c.h);
      const lists = yield Promise.all(mdrive.map((u) => hubLinksFromMdrive(u).catch(() => [])));
      lists.forEach((l) => hubUrls = hubUrls.concat(l));
    } else {
      const sRe = new RegExp("Season\\s*" + (season || 1) + "\\b", "i");
      const ep = episode || 1;
      const eRe = new RegExp("Ep\\s*0?" + ep + "\\b", "i");
      const seasonPages = [];
      $("h5").each((_, el) => {
        if (!sRe.test($(el).text()))
          return;
        const h = $(el).next().find("a").attr("href");
        if (h)
          seasonPages.push(h);
      });
      const lists = yield Promise.all(
        seasonPages.map((sp) => __async(this, null, function* () {
          const sh = yield safeText(sp, { headers: HEADERS2 });
          if (!sh)
            return [];
          const $s = import_cheerio_without_node_native3.default.load(sh);
          const found = [];
          $s("h5").each((_, el) => {
            if (!eRe.test($s(el).text()))
              return;
            const a1 = $s(el).next().find("a").attr("href");
            const a2 = $s(el).next().next().find("a").attr("href");
            [a1, a2].forEach((a) => {
              if (a && /hubcloud/i.test(a))
                found.push(a);
            });
          });
          return found;
        }))
      );
      lists.forEach((l) => hubUrls = hubUrls.concat(l));
    }
    hubUrls = hubUrls.filter((u, i) => hubUrls.indexOf(u) === i);
    const extracted = yield Promise.all(hubUrls.map((u) => withTimeout(extractHubCloud(u, pageUrl), 15e3, [])));
    const links = [].concat.apply([], extracted);
    const out = links.map((l) => {
      const quality = qualityFrom(l.fileTitle);
      const d = describeRelease(l.fileTitle);
      const k = kindInfo(l.kind);
      const size = formatBytes(l.bytes);
      const parts = [quality];
      if (d.tags.length)
        parts.push(d.tags.join(" "));
      if (size)
        parts.push(size);
      if (d.langs.length)
        parts.push("\u{1F50A} " + d.langs.join("+"));
      parts.push(k.label);
      return {
        name: `Ultra \u2022 MoviesDrive ${quality}`,
        title: parts.join(" \u2022 ") + (l.fileTitle ? "\n" + l.fileTitle.slice(0, 120) : ""),
        url: l.url,
        quality,
        size,
        type: "direct",
        source: "moviesdrive",
        prio: k.prio,
        kind: l.kind,
        fileName: l.fileTitle
      };
    });
    console.log(`[Ultra/MoviesDrive] ${out.length} \xE7al\u0131\u015Fan direkt link`);
    return out;
  });
}

// src/ultra/m3u8.js
function resolveUrl(url, baseUrl) {
  if (!url)
    return url;
  if (url.startsWith("http"))
    return url;
  try {
    return new URL(url, baseUrl).toString();
  } catch (e) {
    return url;
  }
}
function qualityFromResolution(resolution) {
  if (!resolution)
    return "Auto";
  const parts = resolution.split("x").map(Number);
  const height = parts[1] || 0;
  if (height >= 2160)
    return "4K";
  if (height >= 1440)
    return "1440p";
  if (height >= 1080)
    return "1080p";
  if (height >= 720)
    return "720p";
  if (height >= 480)
    return "480p";
  if (height >= 360)
    return "360p";
  return "240p";
}
function qualityPriority(q) {
  const map = { "4K": 5, "1440p": 4, "1080p": 3, "720p": 2, "480p": 1, "360p": 0.5, "Auto": 0 };
  return map[q] !== void 0 ? map[q] : 0;
}
function parseM3U8(content, baseUrl) {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const streams = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      current = { bandwidth: null, resolution: null, url: null };
      const bw = line.match(/BANDWIDTH=(\d+)/);
      if (bw)
        current.bandwidth = parseInt(bw[1], 10);
      const res = line.match(/RESOLUTION=(\d+x\d+)/);
      if (res)
        current.resolution = res[1];
    } else if (current && !line.startsWith("#")) {
      current.url = resolveUrl(line, baseUrl);
      current.quality = qualityFromResolution(current.resolution);
      streams.push(current);
      current = null;
    }
  }
  return streams;
}

// src/ultra/sources/vidlink.js
var ENC_DEC_API = "https://enc-dec.app/api";
var VIDLINK_API = "https://vidlink.pro/api/b";
var VIDLINK_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "Referer": "https://vidlink.pro/",
  "Origin": "https://vidlink.pro",
  "Accept": "application/json,*/*"
};
function qualityFromKey(key) {
  const s = String(key || "").toLowerCase();
  if (s.includes("2160") || s.includes("4k"))
    return "4K";
  if (s.includes("1440"))
    return "1440p";
  if (s.includes("1080"))
    return "1080p";
  if (s.includes("720"))
    return "720p";
  if (s.includes("480"))
    return "480p";
  if (s.includes("360"))
    return "360p";
  if (s.includes("240"))
    return "240p";
  const m = s.match(/(\d{3,4})/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 2160)
      return "4K";
    if (n >= 1080)
      return "1080p";
    if (n >= 720)
      return "720p";
    if (n >= 480)
      return "480p";
    if (n >= 360)
      return "360p";
  }
  return "Auto";
}
function formatBytes2(bytes) {
  const n = parseInt(bytes, 10);
  if (!n || isNaN(n))
    return "";
  if (n >= 1073741824)
    return (n / 1073741824).toFixed(2) + " GB";
  return Math.round(n / 1048576) + " MB";
}
function encryptTmdbId(tmdbId) {
  return __async(this, null, function* () {
    const url = `${ENC_DEC_API}/enc-vidlink?text=${tmdbId}`;
    const data = yield fetchJson(url, { headers: { "User-Agent": USER_AGENT } });
    if (data && data.result)
      return data.result;
    throw new Error("Vidlink \u015Fifreleme ba\u015Far\u0131s\u0131z");
  });
}
function fetchAndParsePlaylist(playlistUrl) {
  return __async(this, null, function* () {
    const res = yield makeRequest(playlistUrl, { headers: VIDLINK_HEADERS });
    const text = yield res.text();
    const variants = parseM3U8(text, playlistUrl);
    if (variants.length === 0)
      return [];
    variants.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality));
    return variants.map((v) => ({
      name: `Ultra \u2022 Vidlink ${v.quality}`,
      title: `${v.quality} - Direkt Link (Vidlink)`,
      url: v.url,
      quality: v.quality,
      headers: VIDLINK_HEADERS,
      type: "direct",
      source: "vidlink"
    }));
  });
}
function getVidlinkStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const encrypted = yield encryptTmdbId(tmdbId);
    let url;
    if (mediaType === "tv" || mediaType === "series") {
      const s = season || 1;
      const e = episode || 1;
      url = `${VIDLINK_API}/tv/${encrypted}/${s}/${e}`;
    } else {
      url = `${VIDLINK_API}/movie/${encrypted}`;
    }
    console.log(`[Ultra/Vidlink] ${url}`);
    const data = yield fetchJson(url, { headers: VIDLINK_HEADERS });
    const streams = [];
    const streamObj = data && data.stream ? data.stream : null;
    if (streamObj && streamObj.qualities) {
      Object.keys(streamObj.qualities).forEach((key) => {
        const q = streamObj.qualities[key];
        if (q && q.url) {
          const quality = qualityFromKey(key);
          const sizeStr = formatBytes2(q.size);
          const item = {
            name: `Ultra \u2022 Vidlink ${quality}`,
            title: `${quality}${sizeStr ? " \u2022 " + sizeStr : ""} - Direkt Link (Vidlink)`,
            url: q.url,
            quality,
            type: "direct",
            source: "vidlink"
          };
          if (sizeStr)
            item.size = sizeStr;
          if (q.headers && Object.keys(q.headers).length > 0)
            item.headers = q.headers;
          streams.push(item);
        }
      });
    }
    if (streamObj && streamObj.playlist) {
      try {
        const fromPlaylist = yield fetchAndParsePlaylist(streamObj.playlist);
        fromPlaylist.forEach((s) => streams.push(s));
      } catch (e) {
        console.log(`[Ultra/Vidlink] Playlist parse hatas\u0131: ${e.message}`);
        streams.push({
          name: "Ultra \u2022 Vidlink Auto",
          title: "Auto Quality - Direkt Link (Vidlink)",
          url: streamObj.playlist,
          quality: "Auto",
          headers: VIDLINK_HEADERS,
          type: "direct",
          source: "vidlink"
        });
      }
    }
    if (streams.length === 0 && data && data.url) {
      streams.push({
        name: "Ultra \u2022 Vidlink Auto",
        title: "Auto Quality - Direkt Link (Vidlink)",
        url: data.url,
        quality: "Auto",
        headers: VIDLINK_HEADERS,
        type: "direct",
        source: "vidlink"
      });
    }
    streams.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality));
    console.log(`[Ultra/Vidlink] ${streams.length} direkt link bulundu`);
    return streams;
  });
}

// src/ultra/sources/vidrock.js
var import_crypto_js = __toESM(require("crypto-js"));
var BASE = "https://vidrock.net";
var STREAM_KEY_HEX = "7f3e9c2a8b5d1f4e6a9c3b7d2e5f8a1c4b6d9e2f5a8c1b4d7e9f2a5c8b1d4e7f";
var VIDROCK_HEADERS = {
  "User-Agent": USER_AGENT,
  "Referer": "https://vidrock.net/",
  "Origin": "https://vidrock.net"
};
var SERVER_PRIORITY = { Nova: 3, Orion: 2, Lyra: 1, Elara: 1 };
var ALLOWED_LANGS = ["english", "original", ""];
function decryptUrl(b64url) {
  let b64 = String(b64url).replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4)
    b64 += "=";
  const hex = import_crypto_js.default.enc.Base64.parse(b64).toString(import_crypto_js.default.enc.Hex);
  if (hex.length <= (12 + 16) * 2)
    throw new Error("\u015Fifreli veri \xE7ok k\u0131sa");
  const ivHex = hex.slice(0, 24);
  const ctHex = hex.slice(24, hex.length - 32);
  const out = import_crypto_js.default.AES.decrypt(
    { ciphertext: import_crypto_js.default.enc.Hex.parse(ctHex) },
    import_crypto_js.default.enc.Hex.parse(STREAM_KEY_HEX),
    {
      iv: import_crypto_js.default.enc.Hex.parse(ivHex + "00000002"),
      mode: import_crypto_js.default.mode.CTR,
      padding: import_crypto_js.default.pad.NoPadding
    }
  );
  return out.toString(import_crypto_js.default.enc.Utf8);
}
function qualityFromPath(url) {
  const m = String(url).match(/[\/_](2160|1080|720|480|360)p?[\/_]/i);
  if (!m)
    return "Auto";
  return m[1] === "2160" ? "4K" : m[1] + "p";
}
function expandServer(serverName, url) {
  return __async(this, null, function* () {
    const text = yield safeText(url, { headers: VIDROCK_HEADERS });
    if (!text || text.indexOf("#EXTM3U") === -1)
      return [];
    const variants = parseM3U8(text, url);
    const label = `Ultra \u2022 VidRock ${serverName}`;
    if (variants.length === 0) {
      const q = qualityFromPath(url);
      return [
        {
          name: `${label} ${q}`,
          title: `${q} \u2022 \u0130ngilizce \u2022 HLS (VidRock/${serverName})`,
          url,
          quality: q,
          headers: VIDROCK_HEADERS,
          type: "direct",
          source: "vidrock",
          server: serverName,
          lang: "\u0130ngilizce",
          prio: SERVER_PRIORITY[serverName] || 0
        }
      ];
    }
    const top = variants.slice().sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))[0];
    const probe = yield safeText(top.url, { headers: VIDROCK_HEADERS });
    if (!probe || probe.indexOf("#EXT") === -1) {
      console.log(`[Ultra/VidRock] ${serverName} varyantlar\u0131 a\xE7\u0131lm\u0131yor, atlan\u0131yor`);
      return [];
    }
    const best = {};
    variants.forEach((v) => {
      if (!best[v.quality] || (v.bandwidth || 0) > (best[v.quality].bandwidth || 0))
        best[v.quality] = v;
    });
    return Object.keys(best).map((q) => ({
      name: `${label} ${q}`,
      title: `${q} \u2022 \u0130ngilizce \u2022 HLS (VidRock/${serverName})`,
      url: best[q].url,
      quality: q,
      headers: VIDROCK_HEADERS,
      type: "direct",
      source: "vidrock",
      server: serverName,
      lang: "\u0130ngilizce",
      prio: SERVER_PRIORITY[serverName] || 0
    }));
  });
}
function getVidrockStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const isTv = mediaType === "tv" || mediaType === "series";
    const path = isTv ? `tv/${tmdbId}/${season || 1}/${episode || 1}` : `movie/${tmdbId}`;
    const api = `${BASE}/api/${path}`;
    console.log(`[Ultra/VidRock] ${api}`);
    const data = yield fetchJson(api, { headers: VIDROCK_HEADERS });
    if (!data || typeof data !== "object" || data.error)
      return [];
    const servers = Object.keys(data).filter((k) => {
      const s = data[k];
      if (!s || !s.url)
        return false;
      const lang = String(s.language || "").toLowerCase();
      return ALLOWED_LANGS.indexOf(lang) !== -1;
    });
    const lists = yield Promise.all(
      servers.map((name) => {
        let url;
        try {
          url = decryptUrl(data[name].url);
        } catch (e) {
          return Promise.resolve([]);
        }
        if (!/^https?:\/\//i.test(url))
          return Promise.resolve([]);
        return withTimeout(expandServer(name, url), 6e3, []);
      })
    );
    const seen = {};
    const out = [];
    lists.forEach(
      (l) => l.forEach((s) => {
        if (seen[s.url])
          return;
        seen[s.url] = true;
        out.push(s);
      })
    );
    out.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality) || b.prio - a.prio);
    console.log(`[Ultra/VidRock] ${out.length} direkt link`);
    return out;
  });
}

// src/ultra/sources/vixsrc.js
var VIXSRC_BASE = "https://vixsrc.to";
var VIXSRC_HEADERS = {
  "User-Agent": USER_AGENT,
  "Referer": VIXSRC_BASE + "/",
  "Origin": VIXSRC_BASE,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
};
function extractMasterPlaylist(html) {
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
  const m3u8Match = html.match(/(https?:\/\/[^'"\s]+\.m3u8[^'"\s]*)/);
  if (m3u8Match)
    return m3u8Match[1];
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = scriptRegex.exec(html)) !== null) {
    const inner = m[1];
    const sm = inner.match(/['"]?(https?:\/\/[^'"\s]+(?:\.m3u8|playlist)[^'"\s]*)/);
    if (sm)
      return sm[1];
  }
  return null;
}
function getVixsrcStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    let pageUrl;
    if (mediaType === "tv" || mediaType === "series") {
      const s = season || 1;
      const e = episode || 1;
      pageUrl = `${VIXSRC_BASE}/tv/${tmdbId}/${s}/${e}`;
    } else {
      pageUrl = `${VIXSRC_BASE}/movie/${tmdbId}`;
    }
    console.log(`[Ultra/Vixsrc] Sayfa: ${pageUrl}`);
    const res = yield makeRequest(pageUrl, { headers: VIXSRC_HEADERS });
    const html = yield res.text();
    const masterUrl = extractMasterPlaylist(html);
    if (!masterUrl) {
      console.log("[Ultra/Vixsrc] Master playlist bulunamad\u0131");
      return [];
    }
    console.log(`[Ultra/Vixsrc] Master: ${masterUrl.substring(0, 90)}...`);
    try {
      const mRes = yield makeRequest(masterUrl, { headers: VIXSRC_HEADERS });
      const m3u8Text = yield mRes.text();
      const variants = parseM3U8(m3u8Text, masterUrl);
      if (variants.length === 0) {
        return [
          {
            name: "Ultra \u2022 Vixsrc",
            title: "Auto Quality",
            url: masterUrl,
            quality: "Auto",
            headers: VIXSRC_HEADERS,
            type: "direct",
            source: "vixsrc"
          }
        ];
      }
      variants.sort((a, b) => qualityPriority(b.quality) - qualityPriority(a.quality));
      return variants.map((v) => ({
        name: `Ultra \u2022 Vixsrc ${v.quality}`,
        title: `${v.quality} - Direkt Link`,
        url: v.url,
        quality: v.quality,
        headers: VIXSRC_HEADERS,
        type: "direct",
        source: "vixsrc"
      }));
    } catch (e) {
      console.log(`[Ultra/Vixsrc] M3U8 parse hatas\u0131: ${e.message}, master d\xF6n\xFCl\xFCyor`);
      return [
        {
          name: "Ultra \u2022 Vixsrc",
          title: "Auto Quality",
          url: masterUrl,
          quality: "Auto",
          headers: VIXSRC_HEADERS,
          type: "direct",
          source: "vixsrc"
        }
      ];
    }
  });
}

// src/ultra/sources/torrentio.js
var TORRENTIO_BASE = "https://torrentio.strem.fun";
function normalizeQuality(raw) {
  if (!raw)
    return "Unknown";
  const s = String(raw).toLowerCase();
  if (s.includes("4320") || s.includes("8k"))
    return "4K";
  if (s.includes("2160") || s.includes("4k") || s.includes("uhd"))
    return "4K";
  if (s.includes("1440") || s.includes("2k"))
    return "1440p";
  if (s.includes("1080") || s.includes("fhd"))
    return "1080p";
  if (s.includes("720") || s.includes("hd"))
    return "720p";
  if (s.includes("480"))
    return "480p";
  if (s.includes("360"))
    return "360p";
  const m = s.match(/(\d{3,4})p?/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 2160)
      return "4K";
    if (n >= 1080)
      return "1080p";
    if (n >= 720)
      return "720p";
  }
  return String(raw).toUpperCase();
}
function buildMagnet(infoHash, filename, sources) {
  let magnet = `magnet:?xt=urn:btih:${infoHash}`;
  if (filename)
    magnet += `&dn=${encodeURIComponent(filename)}`;
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
  if (!title)
    return 0;
  const m = String(title).match(/👤\s*(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}
function parseSize(title) {
  if (!title)
    return "";
  const m = String(title).match(/💾\s*([0-9.]+\s*(?:GB|MB|TB))/i);
  return m ? m[1] : "";
}
function parseTracker(title) {
  if (!title)
    return "";
  const m = String(title).match(/⚙️\s*([^\n]+)/);
  return m ? m[1].trim() : "";
}
function getTorrentStreams(tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const info = yield getMediaInfo(tmdbId, mediaType);
    if (!info.imdbId) {
      console.log("[Ultra/Torrentio] IMDb ID bulunamad\u0131, torrent atlan\u0131yor");
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
    const data = yield fetchJson(url, { headers: { "User-Agent": USER_AGENT } });
    const rawStreams = data && data.streams || [];
    console.log(`[Ultra/Torrentio] ${rawStreams.length} torrent bulundu`);
    const streams = [];
    rawStreams.forEach((s) => {
      if (!s.infoHash)
        return;
      const quality = normalizeQuality(s.name || s.title);
      const filename = s.behaviorHints && s.behaviorHints.filename || s.title || "";
      const seeds = parseSeeds(s.title);
      const size = parseSize(s.title);
      const tracker = parseTracker(s.title);
      const magnet = buildMagnet(s.infoHash, filename, s.sources);
      const lines = String(s.title || "").split("\n");
      const releaseName = lines[0] || filename;
      const flagLine = lines.filter((l) => /\uD83C[\uDDE6-\uDDFF]/.test(l)).pop() || "";
      const nameTags = String(s.name || "").split("\n").slice(1).join(" ");
      streams.push({
        name: `Ultra \u2022 Torrent ${quality}`,
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
        seeds
      });
    });
    streams.sort((a, b) => (b.seeds || 0) - (a.seeds || 0));
    return streams;
  });
}

// src/ultra/format.js
var SEP = "  \xB7  ";
var PROVIDER_NAMES = {
  "4khdhub": "4KHDHub",
  moviesdrive: "MoviesDrive",
  vidlink: "Vidlink",
  vidrock: "VidRock",
  vixsrc: "Vixsrc",
  torrentio: "Torrentio"
};
var TRACKER_NAMES = {
  thepiratebay: "The Pirate Bay",
  "1337x": "1337x",
  yts: "YTS",
  eztv: "EZTV",
  rarbg: "RARBG",
  torrentgalaxy: "TorrentGalaxy",
  rutracker: "RuTracker",
  rutor: "Rutor",
  kickasstorrents: "KickassTorrents",
  magnetdl: "MagnetDL",
  horriblesubs: "HorribleSubs",
  nyaasi: "Nyaa",
  tokyotosho: "TokyoTosho",
  anidex: "AniDex",
  ext: "EXT.to",
  torrent9: "Torrent9",
  ilcorsaronero: "ilCorSaRoNeRo",
  mejortorrent: "MejorTorrent",
  wolfmax4k: "Wolfmax4K",
  cinecalidad: "Cinecalidad",
  besttorrents: "BestTorrents",
  bitsearch: "BitSearch"
};
function linkTypeLabel(s) {
  switch (s.kind) {
    case "R2":
      return "\u26A1 Direkt  \xB7  Sar\u0131labilir";
    case "FSL":
      return "\u26A1 FSL  \xB7  Sar\u0131labilir";
    case "S3":
      return "\u26A1 S3  \xB7  Sar\u0131labilir";
    case "PIXEL":
      return "\u{1F680} Google CDN  \xB7  Sarma s\u0131n\u0131rl\u0131";
    case "ZIPDISK":
      return "\u2601\uFE0F ZipDisk";
  }
  if (s.source === "vidlink")
    return "\u{1F3AF} MP4  \xB7  Sar\u0131labilir";
  if (s.source === "vidrock")
    return `\u{1F4FA} HLS  \xB7  Sunucu ${s.server || "?"}`;
  if (s.source === "vixsrc")
    return "\u{1F4FA} HLS";
  return "\u{1F517} Direkt";
}
function parseRelease(text) {
  const t = String(text || "");
  const source = /remux/i.test(t) ? "REMUX" : /blu-?ray|bdrip|brrip/i.test(t) ? "BluRay" : /web-?dl/i.test(t) ? "WEB-DL" : /webrip/i.test(t) ? "WEBRip" : /hdtv/i.test(t) ? "HDTV" : /\b(cam|hdcam|ts|telesync)\b/i.test(t) ? "CAM" : "";
  const video = [];
  if (/\bDV\b|dolby.?vision|\bDoVi\b/i.test(t))
    video.push("Dolby Vision");
  if (/HDR10\+|HDR10plus/i.test(t))
    video.push("HDR10+");
  else if (/\bHDR(10)?\b/i.test(t))
    video.push("HDR");
  if (/x265|hevc|h\.?265/i.test(t))
    video.push("HEVC");
  else if (/x264|avc|h\.?264/i.test(t))
    video.push("H.264");
  else if (/\bav1\b/i.test(t))
    video.push("AV1");
  if (/10.?bit/i.test(t))
    video.push("10bit");
  if (/\bIMAX\b/i.test(t))
    video.push("IMAX");
  const audio = [];
  if (/truehd/i.test(t))
    audio.push("TrueHD");
  else if (/DTS[-.\s]?HD|DTS[-.\s]?MA/i.test(t))
    audio.push("DTS-HD MA");
  else if (/DTS/i.test(t))
    audio.push("DTS");
  else if (/DDP|DD\+|E-?AC-?3/i.test(t))
    audio.push("Dolby Digital+");
  else if (/AC-?3|\bDD\b/i.test(t))
    audio.push("Dolby Digital");
  else if (/AAC/i.test(t))
    audio.push("AAC");
  if (/atmos/i.test(t))
    audio.push("Atmos");
  let best = null;
  const chRe = /(?:^|[^0-9])([2578])[ .]([01])(?![0-9])/g;
  let m;
  while ((m = chRe.exec(t)) !== null) {
    const v = parseFloat(m[1] + "." + m[2]);
    if (best === null || v > best)
      best = v;
  }
  if (best !== null)
    audio.push(best.toFixed(1));
  const langs = [];
  if (/english|\beng\b/i.test(t))
    langs.push("\u0130ngilizce");
  if (/turkish|türkçe|\btur\b/i.test(t))
    langs.push("T\xFCrk\xE7e");
  if (/hindi/i.test(t))
    langs.push("Hint\xE7e");
  if (/tamil/i.test(t))
    langs.push("Tamil");
  if (/telugu/i.test(t))
    langs.push("Telugu");
  if (/multi/i.test(t) && langs.length === 0)
    langs.push("\xC7oklu dil");
  if (/dual.?audio/i.test(t) && langs.length === 0)
    langs.push("\xC7ift ses");
  return { source, video, audio, langs };
}
function badge(rel) {
  const b = [];
  if (rel.source === "REMUX")
    b.push("REMUX");
  if (rel.video.indexOf("Dolby Vision") !== -1)
    b.push("DV");
  if (rel.video.indexOf("HDR10+") !== -1)
    b.push("HDR10+");
  else if (rel.video.indexOf("HDR") !== -1)
    b.push("HDR");
  return b.join(" ");
}
function shortFile(name, max) {
  const n = String(name || "").replace(/\[[^\]]*\.(com|net|org|in|xyz)[^\]]*\]/gi, "").replace(/^[-\s.]+/, "").replace(/\s+/g, " ").trim();
  if (n.length <= max)
    return n;
  return n.slice(0, max - 1).trim() + "\u2026";
}
function seedHealth(seeds) {
  if (seeds >= 100)
    return `\u{1F7E2} ${seeds} seed  \xB7  \xC7ok h\u0131zl\u0131`;
  if (seeds >= 30)
    return `\u{1F7E2} ${seeds} seed  \xB7  H\u0131zl\u0131`;
  if (seeds >= 10)
    return `\u{1F7E1} ${seeds} seed  \xB7  Orta`;
  if (seeds > 0)
    return `\u{1F534} ${seeds} seed  \xB7  Yava\u015F`;
  return "\u26AA Seed bilgisi yok";
}
function prettyTracker(raw) {
  if (!raw)
    return "";
  const key = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
  return TRACKER_NAMES[key] || raw;
}
function formatStream(s) {
  const isTorrent = s.type === "torrent";
  const q = s.quality || "Auto";
  const rel = parseRelease((s.fileName || "") + " " + (s.extraTags || ""));
  const b = badge(rel);
  const icon = isTorrent ? "\u{1F9F2}" : "\u26A1";
  const name = `${icon} ${q}` + (b ? `${SEP}${b}` : "");
  const lines = [];
  const provider = PROVIDER_NAMES[s.source] || s.source || "";
  if (isTorrent) {
    const tr = prettyTracker(s.tracker);
    lines.push(`\u{1F4E1} ${tr || "Torrent"}${SEP}\u{1F9F2} Torrent`);
    const l2 = [seedHealth(s.seeds || 0)];
    if (s.size)
      l2.push(`\u{1F4BE} ${s.size}`);
    lines.push(l2.join(SEP));
  } else {
    lines.push(`\u{1F4E1} ${provider}${SEP}${linkTypeLabel(s)}`);
  }
  const vid = [];
  if (rel.source && rel.source !== "REMUX")
    vid.push(rel.source);
  if (rel.source === "REMUX")
    vid.push("REMUX");
  rel.video.forEach((v) => vid.push(v));
  if (vid.length)
    lines.push(`\u{1F39E} ${vid.join(" \xB7 ")}`);
  const l3 = [];
  const audio = [];
  if (s.flags) {
    audio.push(
      s.flags.replace(/multi\s*audio/i, "\xC7oklu ses").replace(/dual\s*audio/i, "\xC7ift ses").replace(/\s*\/\s*/g, " ").trim()
    );
  } else if (rel.langs.length)
    audio.push(rel.langs.join(" + "));
  else if (s.lang)
    audio.push(s.lang);
  if (rel.audio.length)
    audio.push(rel.audio.join(" \xB7 "));
  if (audio.length)
    l3.push(`\u{1F50A} ${audio.join(" \xB7 ")}`);
  if (!isTorrent && s.size)
    l3.push(`\u{1F4BE} ${s.size}`);
  if (l3.length)
    lines.push(l3.join(SEP));
  if (s.fileName)
    lines.push(`\u{1F4C4} ${shortFile(s.fileName, 70)}`);
  return { name, title: lines.join("\n") };
}

// src/ultra/core.js
var SOURCES = [
  // id, fonksiyon, açık mı, süre sınırı (ms)
  // Vixsrc: Cloudflare engelliyor -> kapalı (boşa istek atmasın)
  { id: "4KHDHub", fn: get4KHDHubStreams, enabled: true, timeout: 25e3 },
  { id: "MoviesDrive", fn: getMoviesDriveStreams, enabled: true, timeout: 25e3 },
  { id: "Vidlink", fn: getVidlinkStreams, enabled: true, timeout: 1e4 },
  { id: "VidRock", fn: getVidrockStreams, enabled: true, timeout: 1e4 },
  { id: "Vixsrc", fn: getVixsrcStreams, enabled: false, timeout: 8e3 },
  { id: "Torrentio", fn: getTorrentStreams, enabled: true, timeout: 12e3 }
];
var MAX_DIRECT_PER_SOURCE_QUALITY = 4;
var MAX_TORRENTS_PER_QUALITY = 5;
var ALLOWED_TORRENT_QUALITIES = ["4K", "1440p", "1080p", "720p"];
function directScore(s) {
  if (s.kind) {
    const k = { R2: 50, FSL: 45, S3: 40, ZIPDISK: 25, PIXEL: 20 };
    return k[s.kind] || 10;
  }
  if (s.source === "vidlink")
    return 42;
  if (s.source === "vixsrc")
    return 38;
  if (s.source === "vidrock")
    return 30 + (s.prio || 0);
  return 10;
}
function sortStreams(streams) {
  return streams.sort((a, b) => {
    const ta = a.type === "torrent" ? 0 : 1;
    const tb = b.type === "torrent" ? 0 : 1;
    if (ta !== tb)
      return tb - ta;
    const dq = qualityPriority(b.quality) - qualityPriority(a.quality);
    if (dq !== 0)
      return dq;
    if (ta === 1)
      return directScore(b) - directScore(a);
    return (b.seeds || 0) - (a.seeds || 0);
  });
}
function limitDirect(list) {
  const counts = {};
  return list.filter((s) => {
    const key = s.source + "|" + s.quality;
    counts[key] = (counts[key] || 0) + 1;
    return counts[key] <= MAX_DIRECT_PER_SOURCE_QUALITY;
  });
}
function limitTorrents(torrents) {
  const counts = {};
  return torrents.filter((t) => {
    if (ALLOWED_TORRENT_QUALITIES.indexOf(t.quality) === -1)
      return false;
    counts[t.quality] = (counts[t.quality] || 0) + 1;
    return counts[t.quality] <= MAX_TORRENTS_PER_QUALITY;
  });
}
function dedupe(streams) {
  const seen = {};
  return streams.filter((s) => {
    if (!s.url || seen[s.url])
      return false;
    seen[s.url] = true;
    return true;
  });
}
var RANK_CHARS = ["\u200B", "\u200C", "\u200D", "\u2060"];
function rankPrefix(i) {
  const n = Math.min(i, 63);
  return RANK_CHARS[n >> 4 & 3] + RANK_CHARS[n >> 2 & 3] + RANK_CHARS[n & 3];
}
function makeGetStreams(sourceIds, tag) {
  return function(tmdbId, mediaType, season, episode) {
    return getStreamsFor(sourceIds, tag || "Ultra", tmdbId, mediaType, season, episode);
  };
}
function getStreamsFor(sourceIds, tag, tmdbId, mediaType, season, episode) {
  return __async(this, null, function* () {
    const t0 = Date.now();
    console.log(`[${tag}] \u0130stek: ${mediaType} tmdb=${tmdbId} s=${season} e=${episode}`);
    const active = SOURCES.filter((s) => s.enabled && (!sourceIds || sourceIds.indexOf(s.id) !== -1));
    const results = yield Promise.all(
      active.map((src) => {
        const started = Date.now();
        const p = Promise.resolve().then(() => src.fn(tmdbId, mediaType, season, episode)).then((r) => {
          console.log(`[${tag}] ${src.id}: ${r.length} link (${Date.now() - started} ms)`);
          return r;
        }).catch((e) => {
          console.log(`[${tag}] ${src.id} hata: ${e && e.message}`);
          return [];
        });
        return withTimeout(p, src.timeout, []).then((r) => r || []);
      })
    );
    let direct = [];
    let torrents = [];
    results.forEach(
      (list) => list.forEach((s) => {
        if (s.type === "torrent")
          torrents.push(s);
        else
          direct.push(s);
      })
    );
    direct = limitDirect(sortStreams(dedupe(direct)));
    torrents = limitTorrents(sortStreams(dedupe(torrents)));
    const all = sortStreams(direct.concat(torrents));
    const fourK = all.filter((s) => s.quality === "4K" && s.type !== "torrent").length;
    console.log(
      `[${tag}] Toplam ${all.length} (direkt ${direct.length}, 4K direkt ${fourK}, torrent ${torrents.length}) \u2014 ${Date.now() - t0} ms`
    );
    return all.map((s, i) => {
      const f = formatStream(s);
      const out = {
        name: rankPrefix(i) + f.name,
        title: f.title,
        // eski Nuvio sürümleri için
        quality: f.title,
        // yeni Nuvio bunu alt yazı olarak gösterir
        url: s.url
      };
      if (s.headers)
        out.headers = s.headers;
      if (s.infoHash)
        out.infoHash = s.infoHash;
      return out;
    });
  });
}

// src/ultrahd/index.js
module.exports = { getStreams: makeGetStreams(["Vidlink", "VidRock"], "Ultra HD") };
