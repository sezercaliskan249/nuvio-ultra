/**
 * ultra4k - src/ultra4k/ altından üretildi
 * Tarih: 2026-11-25T13:28:05.465Z
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
function probeStability(url, ms = 3500, tries = 3) {
  if (!canProbe(url))
    return Promise.resolve(-1);
  const all = [];
  for (let i = 0; i < tries; i++)
    all.push(isPlayable(url, {}, ms));
  return Promise.all(all).then((r) => r.filter(Boolean).length);
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
      isTv,
      seasons: isTv ? data.number_of_seasons || 1 : 0,
      // Dakika: film süresi / dizide ortalama bölüm süresi (gereken hız hesabı için)
      runtime: isTv ? data.episode_run_time && data.episode_run_time[0] || data.last_episode_to_air && data.last_episode_to_air.runtime || 45 : data.runtime || 0
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
  const u2 = m[2].toUpperCase();
  const mul = u2[0] === "T" ? 1099511627776 : u2[0] === "G" ? 1073741824 : u2[0] === "M" ? 1048576 : u2[0] === "K" ? 1024 : 1;
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
      unique.map((r) => r.kind === "PIXEL" ? Promise.resolve(-1) : probeStability(r.url, 3500, 3))
    );
    return unique.map((r, i) => __spreadProps(__spreadValues({}, r), { bytes, fileTitle, okCount: checks[i], flaky: checks[i] > 0 && checks[i] < 3 })).filter((r) => r.okCount !== 0);
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
    const quality2 = qualityFromHeight(height);
    return links.map((l) => {
      const name = l.fileTitle || fileTitle;
      const info = describeRelease(name);
      const k = kindInfo(l.kind);
      const size = formatBytes(l.bytes || baseBytes);
      const parts = [quality2];
      if (info.tags.length)
        parts.push(info.tags.join(" "));
      if (size)
        parts.push(size);
      if (info.langs.length)
        parts.push("\u{1F50A} " + info.langs.join("+"));
      parts.push(k.label);
      return {
        name: `Ultra \u2022 4KHDHub ${quality2}`,
        title: parts.join(" \u2022 ") + (name ? "\n" + name.slice(0, 120) : ""),
        url: l.url,
        quality: quality2,
        size,
        type: "direct",
        source: "4khdhub",
        prio: k.prio,
        kind: l.kind,
        flaky: !!l.flaky,
        bytes: l.bytes || baseBytes || 0,
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
            return data.hits.map((h) => h.url).filter((u2) => !!u2);
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
    const search2 = yield fetchJson(`${main}/search.php?q=${info.imdbId}`, { headers: HEADERS2 });
    const hit = search2 && search2.hits ? search2.hits.map((h) => h.document).find((d) => d && d.imdb_id === info.imdbId) : null;
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
      const lists = yield Promise.all(mdrive.map((u2) => hubLinksFromMdrive(u2).catch(() => [])));
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
    hubUrls = hubUrls.filter((u2, i) => hubUrls.indexOf(u2) === i);
    const extracted = yield Promise.all(hubUrls.map((u2) => withTimeout(extractHubCloud(u2, pageUrl), 15e3, [])));
    const links = [].concat.apply([], extracted);
    const out = links.map((l) => {
      const quality2 = qualityFrom(l.fileTitle);
      const d = describeRelease(l.fileTitle);
      const k = kindInfo(l.kind);
      const size = formatBytes(l.bytes);
      const parts = [quality2];
      if (d.tags.length)
        parts.push(d.tags.join(" "));
      if (size)
        parts.push(size);
      if (d.langs.length)
        parts.push("\u{1F50A} " + d.langs.join("+"));
      parts.push(k.label);
      return {
        name: `Ultra \u2022 MoviesDrive ${quality2}`,
        title: parts.join(" \u2022 ") + (l.fileTitle ? "\n" + l.fileTitle.slice(0, 120) : ""),
        url: l.url,
        quality: quality2,
        size,
        type: "direct",
        source: "moviesdrive",
        prio: k.prio,
        kind: l.kind,
        flaky: !!l.flaky,
        bytes: l.bytes || 0,
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
  const height = Math.max(parts[1] || 0, Math.round((parts[0] || 0) * 9 / 16 / 10) * 10);
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
          const quality2 = qualityFromKey(key);
          const sizeStr = formatBytes2(q.size);
          const item = {
            name: `Ultra \u2022 Vidlink ${quality2}`,
            title: `${quality2}${sizeStr ? " \u2022 " + sizeStr : ""} - Direkt Link (Vidlink)`,
            url: q.url,
            quality: quality2,
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
      const quality2 = normalizeQuality(s.name || s.title);
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
        name: `Ultra \u2022 Torrent ${quality2}`,
        title: releaseName,
        tracker,
        fileName: releaseName,
        extraTags: nameTags,
        flags: flagLine.trim(),
        url: magnet,
        quality: quality2,
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

// src/ultra/tr/common.js
var UA = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";
var TMDB_API_KEY2 = "68e094699525b18a70bab2f86b1fa706";
var infoCache = {};
function trInfo(tmdbId, mediaType) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const key = (isTv ? "tv:" : "movie:") + tmdbId;
  if (infoCache[key])
    return infoCache[key];
  const url = `https://api.themoviedb.org/3/${isTv ? "tv" : "movie"}/${tmdbId}?api_key=${TMDB_API_KEY2}&language=tr-TR&append_to_response=external_ids`;
  const p = fetch(url).then((r) => r.json()).then((d) => {
    const date = (isTv ? d.first_air_date : d.release_date) || "";
    return {
      titleTr: (isTv ? d.name : d.title) || "",
      titleOrig: (isTv ? d.original_name : d.original_title) || "",
      year: parseInt(date.slice(0, 4), 10) || 0,
      lastYear: parseInt(String(d.last_air_date || "").slice(0, 4), 10) || 0,
      imdbId: d.external_ids && d.external_ids.imdb_id || d.imdb_id || null,
      isTv
    };
  }).catch((e) => {
    delete infoCache[key];
    throw e;
  });
  infoCache[key] = p;
  return p;
}
function slugify(t) {
  return String(t || "").replace(/İ/g, "i").replace(/I/g, "i").toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[âàáä]/g, "a").replace(/[éèêë]/g, "e").replace(/[îíï]/g, "i").replace(/[ôóò]/g, "o").replace(/[ûúù]/g, "u").replace(/&/g, " and ").replace(/['’`]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function norm(t) {
  return slugify(t).replace(/-/g, "");
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function originOf(url) {
  const m = String(url || "").match(/^(https?:\/\/[^/?#]+)/i);
  return m ? m[1] : "";
}
function absUrl(u2, base) {
  if (!u2)
    return u2;
  u2 = String(u2).trim();
  if (/^https?:\/\//i.test(u2))
    return u2;
  if (u2.indexOf("//") === 0)
    return "https:" + u2;
  if (u2[0] === "/")
    return originOf(base) + u2;
  return originOf(base) + "/" + u2;
}
function decodeHtml(s) {
  return String(s || "").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
function hexDecode(s) {
  const clean = String(s || "").replace(/\\x/g, "");
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2)
    return null;
  let out = "";
  for (let i = 0; i < clean.length; i += 2)
    out += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  try {
    return decodeURIComponent(escape(out));
  } catch (e) {
    return out;
  }
}
function req(_0) {
  return __async(this, arguments, function* (url, opts = {}) {
    const headers = Object.assign({ "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.7" }, opts.headers || {});
    const init = { method: opts.method || "GET", headers };
    if (opts.form) {
      init.method = "POST";
      init.body = Object.keys(opts.form).map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(opts.form[k] == null ? "" : opts.form[k])).join("&");
      headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
    }
    try {
      const p = fetch(url, init).then((r) => __async(this, null, function* () {
        const text = yield r.text();
        const get = (n) => r.headers && r.headers.get ? r.headers.get(n) : null;
        return { ok: r.ok, status: r.status, url: r.url || url, text: text || "", cookie: cookieFrom(get("set-cookie")) };
      }));
      const res = yield withTimeout(p, opts.timeout || 9e3, null);
      return res || { ok: false, status: 0, url, text: "", timeout: true, cookie: "" };
    } catch (e) {
      return { ok: false, status: 0, url, text: "", error: String(e && e.message || e), cookie: "" };
    }
  });
}
function reqJson(_0) {
  return __async(this, arguments, function* (url, opts = {}) {
    const r = yield req(url, opts);
    try {
      return { r, json: JSON.parse(r.text) };
    } catch (e) {
      return { r, json: null };
    }
  });
}
function cookieFrom(sc) {
  if (!sc)
    return "";
  return String(sc).split(/,(?=\s*[A-Za-z0-9_\-.]+=)/).map((c) => c.trim().split(";")[0]).filter((c) => c && c.indexOf("=") > 0).join("; ");
}
function whyFailed(r) {
  if (!r)
    return "cevap yok";
  if (r.timeout)
    return "zaman a\u015F\u0131m\u0131";
  if (r.status === 0)
    return "ba\u011Flanamad\u0131" + (r.error ? ` (${r.error.slice(0, 40)})` : "");
  if ((r.status === 403 || r.status === 503) && /cloudflare|cf-ray|attention required|just a moment/i.test(r.text))
    return `Cloudflare engeli (${r.status})`;
  return `HTTP ${r.status}`;
}
var baseCache = {};
function resolveBase(key, candidates, marker, diag) {
  if (baseCache[key])
    return baseCache[key];
  const p = (() => __async(this, null, function* () {
    const reasons = [];
    for (let i = 0; i < candidates.length; i++) {
      const r = yield req(candidates[i] + "/", { timeout: 8e3 });
      if (!r.ok && /cloudflare/i.test(whyFailed(r))) {
        reasons.push(`${candidates[i].replace(/^https?:\/\//, "")}: ${whyFailed(r)}`);
        break;
      }
      if (r.ok && marker.test(r.text)) {
        const base = originOf(r.url) || candidates[i];
        if (diag)
          diag.step(`adres \u2713 ${base.replace(/^https?:\/\//, "")}`);
        return { base, cookie: r.cookie };
      }
      reasons.push(`${candidates[i].replace(/^https?:\/\//, "")}: ${r.ok ? "i\xE7erik tan\u0131nmad\u0131" : whyFailed(r)}`);
    }
    if (diag)
      diag.fail(`site a\xE7\u0131lmad\u0131 \u2192 ${reasons.slice(0, 2).join(" | ")}`);
    delete baseCache[key];
    return null;
  }))();
  baseCache[key] = p;
  return p;
}
function makeDiag(site) {
  const steps = [];
  return {
    site,
    steps,
    step(msg) {
      steps.push({ ok: true, msg });
      console.log(`[${site}] ${msg}`);
    },
    fail(msg) {
      steps.push({ ok: false, msg });
      console.log(`[${site}] \u2717 ${msg}`);
    }
  };
}
function yearOk(found, want) {
  if (!found || !want)
    return true;
  return Math.abs(found - want) <= 1;
}
function qualityFromText(t, fallback) {
  const s = String(t || "");
  if (/2160|4k|uhd/i.test(s))
    return "4K";
  if (/1080|full ?hd|fhd/i.test(s))
    return "1080p";
  if (/720|\bhd\b/i.test(s))
    return "720p";
  if (/480/i.test(s))
    return "480p";
  if (/360/i.test(s))
    return "360p";
  return fallback || "Auto";
}

// src/ultra/sources/filmmodu.js
var CANDIDATES = ["https://www.filmmodu.one", "https://www.filmmodu.com"];
var MARKER = /filmmodu/i;
function parseCards(html, base) {
  const out = [];
  const re = /<div class="col-md-2 col-xs-6 movie">([\s\S]*?)<p class="bottom">/g;
  let m;
  while (m = re.exec(html)) {
    const b = m[1];
    const href = (b.match(/<a href="([^"]+-film-izle)"/) || [])[1];
    if (!href)
      continue;
    out.push({
      url: absUrl(href, base),
      orig: decodeHtml((b.match(/class="original-name">([^<]*)/) || [])[1] || ""),
      tr: decodeHtml((b.match(/class="turkish-name">([^<]*)/) || [])[1] || ""),
      year: parseInt((b.match(/class="top">\s*(\d{4})/) || [])[1], 10) || 0
    });
  }
  return out;
}
function suggest(base, term, H2) {
  return __async(this, null, function* () {
    const { json } = yield reqJson(`${base}/search?query=${encodeURIComponent(term)}`, {
      headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Accept: "application/json" }, H2)
    });
    return json && Array.isArray(json.suggestions) ? json.suggestions.filter((x) => x && x.url).map((x) => ({ url: absUrl(x.url, base), orig: x.value || "", tr: x.turkish_name || "" })) : [];
  });
}
function search(base, term, H2) {
  return __async(this, null, function* () {
    const r = yield req(`${base}/film-ara?term=${encodeURIComponent(term)}`, { headers: H2 });
    return r.ok ? parseCards(r.text, base) : [];
  });
}
function getFilmModuStreams(tmdbId, mediaType, season, episode, diag) {
  return __async(this, null, function* () {
    if (mediaType === "tv" || mediaType === "series")
      return [];
    const site = yield resolveBase("filmmodu", CANDIDATES, MARKER, diag);
    if (!site)
      return [];
    const base = site.base;
    const H2 = { Referer: base + "/" };
    const info = yield trInfo(tmdbId, mediaType);
    const same = (c) => norm(c.orig) === norm(info.titleOrig) || c.tr && norm(c.tr) === norm(info.titleTr);
    let card = null;
    let checkYear = false;
    if (info.imdbId) {
      const list = yield suggest(base, info.imdbId, H2);
      card = list.length === 1 ? list[0] : list.find(same) || null;
    }
    if (!card) {
      checkYear = true;
      const terms = [info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i);
      for (const t of terms) {
        card = (yield suggest(base, t, H2)).find(same) || null;
        if (!card)
          card = (yield search(base, t, H2)).find((c) => same(c) && yearOk(c.year, info.year)) || null;
        if (card)
          break;
      }
    }
    if (!card) {
      diag && diag.fail(`film bulunamad\u0131 (${info.titleOrig || info.titleTr} ${info.year})`);
      return [];
    }
    diag && diag.step(`film \u2713 ${card.url.replace(base, "")}`);
    const page = yield req(card.url, { headers: H2 });
    const vid = (page.text.match(/var videoId\s*=\s*'(\d+)'/) || [])[1];
    if (!vid) {
      diag && diag.fail(`film sayfas\u0131 a\xE7\u0131lmad\u0131 (${page.status})`);
      return [];
    }
    if (checkYear) {
      const y = parseInt((page.text.match(/itemprop="dateCreated">\s*(\d{4})/) || [])[1], 10);
      if (!yearOk(y, info.year)) {
        diag && diag.fail(`y\u0131l tutmad\u0131 (${y} \u2260 ${info.year})`);
        return [];
      }
    }
    const types = [];
    if (/-turkce-dublaj-film-izle"/.test(page.text) || /var videoType\s*=\s*'tr'/.test(page.text))
      types.push({ t: "tr", tr: "dublaj" });
    if (/-altyazili-film-izle"/.test(page.text) || /var videoType\s*=\s*'en'/.test(page.text))
      types.push({ t: "en", tr: "altyazi" });
    if (!types.length)
      types.push({ t: "en", tr: "altyazi" }, { t: "tr", tr: "dublaj" });
    const lists = yield Promise.all(
      types.map((ty) => __async(this, null, function* () {
        const { json } = yield reqJson(`${base}/get-source?movie_id=${vid}&type=${ty.t}`, {
          headers: { Referer: card.url, "X-Requested-With": "XMLHttpRequest", Accept: "application/json" }
        });
        if (!json || !Array.isArray(json.sources))
          return [];
        const subs = json.subtitle ? [{ url: absUrl(json.subtitle, base), language: "tr", name: "T\xFCrk\xE7e" }] : [];
        return json.sources.filter((s) => s && s.src).map((s) => {
          let u2 = s.src;
          if (!/\.m3u8/.test(u2) && /mpegurl/i.test(s.type || ""))
            u2 += ".m3u8";
          return {
            url: u2,
            quality: qualityFromText(s.label || s.res, "Auto"),
            type: "direct",
            source: "filmmodu",
            tr: ty.tr,
            host: "FilmModu",
            format: "HLS",
            headers: { Referer: base + "/", Origin: base },
            subtitles: subs
          };
        });
      }))
    );
    const out = [].concat.apply([], lists).filter((s) => s.quality !== "360p");
    diag && (out.length ? diag.step(`${out.length} link`) : diag.fail("get-source bo\u015F d\xF6nd\xFC"));
    return out;
  });
}

// src/ultra/tr/extractors.js
function hostName(url) {
  const u2 = String(url || "").toLowerCase();
  if (/vidmoly/.test(u2))
    return "VidMoly";
  if (/ok\.ru|odnoklassniki/.test(u2))
    return "Ok.ru";
  if (/sibnet/.test(u2))
    return "Sibnet";
  if (/filemoon|moonplayer|bf0skv|kerapoxy|z1ekv717|smdfs40r|be6721|boosteradx/.test(u2))
    return "FileMoon";
  if (/dzen\.ru|zen\.yandex/.test(u2))
    return "Dzen";
  if (/netu|hqq\.|waaw/.test(u2))
    return "Netu";
  return (originOf(u2).replace(/^https?:\/\/(www\.)?/, "").split(".")[0] || "Video").replace(/^./, (c) => c.toUpperCase());
}
function extractEmbed(iframeUrl, referer) {
  return __async(this, null, function* () {
    const url = absUrl(decodeHtml(iframeUrl), referer);
    if (!url)
      return [];
    const h = hostName(url);
    try {
      if (/[?&]v=(\\x|%5Cx)?[0-9a-f]{20,}/i.test(url) && /playerjs|cstkcstk|vercel\.app|github\.io/i.test(url))
        return hexParam(url);
      if (h === "VidMoly")
        return yield vidmoly(url, referer);
      if (h === "Ok.ru")
        return yield okru(url);
      if (h === "Sibnet")
        return yield sibnet(url, referer);
      if (h === "FileMoon")
        return yield filemoon(url, referer);
      if (h === "Dzen")
        return yield dzen(url);
      if (h === "Netu")
        return [];
      return yield generic(url, referer, h);
    } catch (e) {
      console.log(`[Extract] ${h} hata: ${e && e.message}`);
      return [];
    }
  });
}
function hexParam(url) {
  const m = url.match(/[?&]v=([^&]+)/);
  const dec = m && hexDecode(decodeURIComponent(m[1]));
  if (!dec || !/^https?:/i.test(dec))
    return [];
  return [{ url: dec, quality: "Auto", host: "PlayerJS" }];
}
function vidmoly(url, referer) {
  return __async(this, null, function* () {
    let u2 = url.replace(/\/w\/([a-z0-9]+)/i, "/embed-$1.html");
    const headers = { Referer: referer || "https://vidmoly.net/", "Sec-Fetch-Dest": "iframe" };
    let text = "";
    let finalUrl = u2;
    for (let i = 0; i < 3; i++) {
      const r = yield req(u2, { headers, timeout: 8e3 });
      text = r.text;
      finalUrl = r.url || u2;
      if (/sources\s*:/.test(text))
        break;
      yield sleep(600);
    }
    const m = text.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/) || text.match(/file\s*:\s*["'](https?:[^"']+\.m3u8[^"']*)["']/);
    if (!m)
      return [];
    const origin = originOf(finalUrl);
    const subs = [];
    const tr = text.match(/tracks\s*:\s*\[([\s\S]*?)\]/);
    if (tr) {
      const re = /file\s*:\s*["']([^"']+)["'][^}]*?label\s*:\s*["']([^"']+)["']/g;
      let t;
      while (t = re.exec(tr[1])) {
        if (/thumb|preview|sprite/i.test(t[1]))
          continue;
        subs.push({ url: absUrl(t[1], finalUrl), language: /t[uü]rk/i.test(t[2]) ? "tr" : t[2], name: t[2] });
      }
    }
    return [{ url: m[1], quality: "Auto", host: "VidMoly", headers: { Referer: origin + "/", Origin: origin }, subtitles: subs }];
  });
}
var OK_Q = { mobile: "144p", lowest: "240p", low: "360p", sd: "480p", hd: "720p", full: "1080p", quad: "1440p", ultra: "4K" };
function okru(url) {
  return __async(this, null, function* () {
    const id = (url.match(/(?:videoembed|video)\/(\d+)/) || [])[1];
    if (!id)
      return [];
    const r = yield req("https://ok.ru/videoembed/" + id, { headers: { "User-Agent": UA }, timeout: 8e3 });
    const m = r.text.match(/data-options="([^"]+)"/);
    if (!m)
      return [];
    let meta;
    try {
      const opts = JSON.parse(decodeHtml(m[1]));
      meta = opts.flashvars && opts.flashvars.metadata;
      if (typeof meta === "string")
        meta = JSON.parse(meta);
    } catch (e) {
      return [];
    }
    if (!meta || !meta.videos)
      return [];
    const vids = meta.videos.filter((v) => v && v.url && OK_Q[v.name]).map((v) => ({ url: absUrl(v.url, "https://ok.ru"), quality: OK_Q[v.name], host: "Ok.ru" })).filter((v) => ["1080p", "720p", "480p", "4K", "1440p"].indexOf(v.quality) !== -1);
    return vids.reverse().slice(0, 2);
  });
}
function sibnet(url, referer) {
  return __async(this, null, function* () {
    let shell = url;
    const id = (url.match(/videoid=(\d+)/) || url.match(/video(\d+)/) || [])[1];
    if (id)
      shell = "https://video.sibnet.ru/shell.php?videoid=" + id;
    const r = yield req(shell, { headers: { Referer: referer || "https://video.sibnet.ru/" }, timeout: 8e3 });
    const m = r.text.match(/player\.src\(\[\{\s*src\s*:\s*"([^"]+)"/) || r.text.match(/src\s*:\s*"(\/v\/[^"]+)"/);
    if (!m)
      return [];
    return [{ url: absUrl(m[1], "https://video.sibnet.ru"), quality: "Auto", host: "Sibnet", headers: { Referer: shell } }];
  });
}
function unpack(src) {
  const m = String(src).match(
    /eval\(function\(p,a,c,k,e,(?:r|d)\)\{[\s\S]*?\}\(\s*'([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
  );
  if (!m)
    return null;
  let p = m[1].replace(/\\'/g, "'");
  const a = parseInt(m[2], 10);
  let c = parseInt(m[3], 10);
  const k = m[4].split("|");
  const enc = (n) => (n < a ? "" : enc(Math.floor(n / a))) + ((n = n % a) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  while (c--)
    if (k[c])
      p = p.replace(new RegExp("\\b" + enc(c) + "\\b", "g"), k[c]);
  return p;
}
function filemoon(url, referer) {
  return __async(this, null, function* () {
    const r = yield req(url, { headers: { Referer: referer || url }, timeout: 8e3 });
    let page = r.text;
    let pageUrl = r.url || url;
    const ifr = page.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (ifr && !/eval\(function\(p,a,c,k/.test(page)) {
      const u2 = absUrl(ifr[1], pageUrl);
      const r2 = yield req(u2, { headers: { Referer: pageUrl, "Sec-Fetch-Dest": "iframe" }, timeout: 8e3 });
      page = r2.text;
      pageUrl = r2.url || u2;
    }
    const js = unpack(page) || page;
    const m = js.match(/file\s*:\s*["'](https?:[^"']+\.m3u8[^"']*)["']/) || js.match(/["'](https?:[^"']+\.m3u8[^"']*)["']/);
    if (!m)
      return [];
    const origin = originOf(pageUrl);
    return [{ url: m[1], quality: "Auto", host: "FileMoon", headers: { Referer: origin + "/", Origin: origin } }];
  });
}
function dzen(url) {
  return __async(this, null, function* () {
    if (/\.m3u8/.test(url))
      return [{ url, quality: "Auto", host: "Dzen" }];
    const r = yield req(url, { timeout: 8e3 });
    const t = r.text.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").replace(/\\u0026/gi, "&");
    const m = t.match(/(https:\/\/[^"'\s]+?\.m3u8[^"'\s]*)/);
    if (!m)
      return [];
    return [{ url: m[1], quality: "Auto", host: "Dzen" }];
  });
}
function generic(url, referer, host) {
  return __async(this, null, function* () {
    const r = yield req(url, { headers: { Referer: referer || url }, timeout: 8e3 });
    let t = r.text;
    const un = unpack(t);
    if (un)
      t += "\n" + un;
    const out = [];
    let m = t.match(/["']?file["']?\s*:\s*["']([^"']+)["']/);
    if (m) {
      let f = m[1];
      if (/\\x[0-9a-f]{2}/i.test(f))
        f = hexDecode(f) || f;
      if (/^(https?:)?\/\//.test(f) && /m3u8|mp4|\/hls\/|\/v\//i.test(f))
        out.push(absUrl(f, r.url));
    }
    if (!out.length) {
      const m2 = t.replace(/\\\//g, "/").match(/(https?:\/\/[^"'\s<>]+?\.m3u8[^"'\s<>]*)/);
      if (m2)
        out.push(m2[1]);
    }
    if (!out.length)
      return [];
    const subs = [];
    const tr = t.match(/tracks["']?\s*[:=]\s*\[([\s\S]*?)\]/);
    if (tr) {
      const re = /["']?file["']?\s*:\s*["']([^"']+)["'][^}]*?["']?label["']?\s*:\s*["']([^"']+)["']/g;
      let s;
      while (s = re.exec(tr[1])) {
        const label = s[2].replace(/\\u0131/g, "\u0131").replace(/\\u0130/g, "\u0130").replace(/\\u00fc/g, "\xFC").replace(/\\u00e7/g, "\xE7");
        if (/forced|thumb/i.test(label))
          continue;
        subs.push({ url: absUrl(s[1].replace(/\\\//g, "/").replace(/\\/g, ""), r.url), language: /t[uü]rk/i.test(label) ? "tr" : label, name: label });
      }
    }
    const origin = originOf(r.url || url);
    return out.map((u2) => ({
      url: u2,
      quality: qualityFromText(u2, "Auto"),
      host,
      headers: { Referer: origin + "/", Origin: origin },
      subtitles: subs
    }));
  });
}

// src/ultra/sources/webteizle.js
var CANDIDATES2 = ["https://webteizle.info"];
var MARKER2 = /webteizle/i;
var SKIP = /netu|uptobox|streamsb|fragman|youtube/i;
var MAX_ALT = 6;
var aspVer = null;
function pageMatches(html, info) {
  const imdb = (html.match(/imdb\.com\/title\/(tt\d+)/) || [])[1];
  if (imdb && info.imdbId)
    return imdb === info.imdbId;
  const y = parseInt((html.match(/"datePublished":"(\d{4})/) || html.match(/\((\d{4})\)/) || [])[1], 10);
  return yearOk(y, info.year);
}
function findFilm(base, info, H2, diag) {
  return __async(this, null, function* () {
    const slugs = [slugify(info.titleOrig), slugify(info.titleTr)].filter((s, i, a) => s && a.indexOf(s) === i);
    const cands = [];
    slugs.forEach((s) => {
      cands.push(`${base}/izle/altyazi/${s}`, `${base}/izle/dublaj/${s}`);
    });
    for (let i = 0; i < cands.length; i += 2) {
      const rs = yield Promise.all([req(cands[i], { headers: H2 }), cands[i + 1] ? req(cands[i + 1], { headers: H2 }) : null]);
      for (const r of rs) {
        if (r && r.ok && /id="dilsec"/.test(r.text) && pageMatches(r.text, info))
          return { url: r.url || cands[i], html: r.text };
      }
    }
    for (const q of [info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i)) {
      const { json } = yield reqJson(`${base}/ajax/arama.asp`, {
        form: { q },
        headers: Object.assign({ "X-Requested-With": "XMLHttpRequest" }, H2)
      });
      const items = [];
      if (json && json.results) {
        Object.keys(json.results).forEach((k) => {
          const g = json.results[k];
          (g && g.results ? g.results : []).forEach((it) => items.push(it));
        });
      }
      const pick = items.find((it) => norm(it.title || it.name).indexOf(norm(info.titleOrig)) === 0) || items.find((it) => norm(it.title || it.name).indexOf(norm(info.titleTr)) === 0);
      if (pick && pick.url) {
        const u2 = absUrl(pick.url, base);
        const r = yield req(u2, { headers: H2 });
        if (r.ok && /id="dilsec"/.test(r.text) && pageMatches(r.text, info))
          return { url: r.url || u2, html: r.text };
      }
    }
    diag && diag.fail(`film bulunamad\u0131 (${slugs[0] || "?"})`);
    return null;
  });
}
function getAlternatives(base, filmId, dil, H2, referer) {
  return __async(this, null, function* () {
    const tryVer = (v) => __async(this, null, function* () {
      const { json: json2 } = yield reqJson(`${base}/ajax/dataAlternatif${v}.asp`, {
        form: { filmid: filmId, dil, s: "", b: "", bot: 0 },
        headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Referer: referer, Origin: base }, H2)
      });
      return json2;
    });
    let json = yield tryVer(aspVer || "3");
    if (!json && !aspVer) {
      const js = yield req(`${base}/js/site.min.js`, { headers: H2 });
      const v = (js.text.match(/dataAlternatif(\d*)\.asp/) || [])[1];
      if (v != null && v !== "3") {
        aspVer = v;
        json = yield tryVer(v);
      }
    }
    return json && json.status === "success" && Array.isArray(json.data) ? json.data : [];
  });
}
function embedToIframe(base, id, H2, referer) {
  return __async(this, null, function* () {
    const r = yield req(`${base}/ajax/dataEmbed.asp`, {
      form: { id },
      headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Referer: referer, Origin: base }, H2)
    });
    const t = r.text;
    const ifr = t.match(/<iframe[^>]+src=["']([^"']+)["']/i);
    if (ifr)
      return absUrl(ifr[1], base);
    const sm = t.match(/(vidmoly|okru|filemoon|dzen|sibnet)\s*\(\s*['"]([^'"]+)['"]/i);
    if (sm) {
      const id2 = sm[2];
      switch (sm[1].toLowerCase()) {
        case "vidmoly":
          return `https://vidmoly.net/embed-${id2}.html`;
        case "okru":
          return `https://ok.ru/videoembed/${id2}`;
        case "filemoon":
          return `https://filemoon.sx/e/${id2}`;
        case "dzen":
          return `https://dzen.ru/embed/${id2}`;
        case "sibnet":
          return `https://video.sibnet.ru/shell.php?videoid=${id2}`;
      }
    }
    return null;
  });
}
function getWebteizleStreams(tmdbId, mediaType, season, episode, diag) {
  return __async(this, null, function* () {
    if (mediaType === "tv" || mediaType === "series")
      return [];
    const site = yield resolveBase("webteizle", CANDIDATES2, MARKER2, diag);
    if (!site)
      return [];
    const base = site.base;
    const H2 = { Referer: base + "/" };
    if (site.cookie)
      H2.Cookie = site.cookie;
    const info = yield trInfo(tmdbId, mediaType);
    const film = yield findFilm(base, info, H2, diag);
    if (!film)
      return [];
    const filmId = (film.html.match(/id="dilsec"[^>]*data-id="(\d+)"/) || film.html.match(/id="wip"[^>]*data-id="(\d+)"/) || [])[1];
    if (!filmId) {
      diag && diag.fail("film ID okunamad\u0131");
      return [];
    }
    diag && diag.step(`film \u2713 ${film.url.replace(base, "")} (id ${filmId})`);
    const langs = [];
    if (/data-dil="0"/.test(film.html) || /\/izle\/dublaj\//.test(film.html))
      langs.push({ dil: "0", tr: "dublaj" });
    if (/data-dil="1"/.test(film.html) || /\/izle\/altyazi\//.test(film.html))
      langs.push({ dil: "1", tr: "altyazi" });
    if (!langs.length)
      langs.push({ dil: "1", tr: "altyazi" }, { dil: "0", tr: "dublaj" });
    let altCount = 0;
    const lists = yield Promise.all(
      langs.map((L) => __async(this, null, function* () {
        const alts = (yield getAlternatives(base, filmId, L.dil, H2, film.url)).filter((a) => !SKIP.test(a.baslik || ""));
        altCount += alts.length;
        const res = yield Promise.all(
          alts.slice(0, MAX_ALT).map((a) => __async(this, null, function* () {
            const iframe = yield embedToIframe(base, a.id, H2, film.url);
            if (!iframe)
              return [];
            const links = yield extractEmbed(iframe, film.url);
            return links.map((l) => ({
              url: l.url,
              quality: l.quality !== "Auto" ? l.quality : qualityFromText(a.baslik + " " + (a.kalite || ""), "1080p"),
              type: "direct",
              source: "webteizle",
              tr: L.tr,
              host: l.host || hostName(iframe),
              format: /\.m3u8/i.test(l.url) ? "HLS" : "MP4",
              headers: l.headers,
              subtitles: l.subtitles
            }));
          }))
        );
        return [].concat.apply([], res);
      }))
    );
    const out = [].concat.apply([], lists);
    if (diag) {
      if (!altCount)
        diag.fail("alternatif listesi bo\u015F (dataAlternatif)");
      else if (!out.length)
        diag.fail(`${altCount} alternatif var ama hi\xE7biri \xE7\xF6z\xFClemedi`);
      else
        diag.step(`${out.length} link (${altCount} alternatif)`);
    }
    return out;
  });
}

// src/ultra/sources/sezonlukdizi.js
var CANDIDATES3 = ["https://sezonlukdizi.cc"];
var MARKER3 = /sezonlukdizi/i;
var SKIP2 = /netu|pixel/i;
var MAX_ALT2 = 6;
var aspCache = null;
function getAsp(base, H2) {
  return __async(this, null, function* () {
    if (aspCache)
      return aspCache;
    const r = yield req(`${base}/js/site.min.js`, { headers: H2 });
    aspCache = {
      alt: (r.text.match(/dataAlternatif(\d*)\.asp/) || [])[1] || "22",
      embed: (r.text.match(/dataEmbed(\d*)\.asp/) || [])[1] || "22"
    };
    return aspCache;
  });
}
function findShow(base, info, H2, diag) {
  return __async(this, null, function* () {
    const slugs = [slugify(info.titleOrig), slugify(info.titleTr)].filter((s, i, a) => s && a.indexOf(s) === i);
    const rs = yield Promise.all(slugs.map((s) => req(`${base}/diziler/${s}.html`, { headers: H2 })));
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      if (!r.ok || /Sayfa Bulunamad|Haydaaa/i.test(r.text))
        continue;
      const m = r.text.match(/href="\/([^/"]+)\/\d+-sezon-\d+-bolum\.html/i);
      const yearHit = !info.year || r.text.indexOf(String(info.year)) !== -1;
      if (m && yearHit)
        return m[1];
      if (m)
        return m[1];
    }
    for (const q of [info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i)) {
      const { json } = yield reqJson(`${base}/ajax/arama.asp`, {
        form: { q },
        headers: Object.assign({ "X-Requested-With": "XMLHttpRequest" }, H2)
      });
      const items = [];
      if (json && json.results) {
        Object.keys(json.results).forEach((k) => {
          const g = json.results[k];
          (g && g.results ? g.results : []).forEach((it) => items.push(it));
        });
      }
      const pick = items.find((it) => norm(it.title || it.name) === norm(info.titleOrig)) || items.find((it) => norm(it.title || it.name) === norm(info.titleTr)) || items.find((it) => norm(it.title || it.name).indexOf(norm(info.titleOrig)) === 0);
      const m = pick && String(pick.url || "").match(/\/diziler\/([^/.]+)\.html/);
      if (m)
        return m[1];
    }
    diag && diag.fail(`dizi bulunamad\u0131 (${slugs[0] || "?"})`);
    return null;
  });
}
function getSezonlukDiziStreams(tmdbId, mediaType, season, episode, diag) {
  return __async(this, null, function* () {
    if (!(mediaType === "tv" || mediaType === "series"))
      return [];
    const site = yield resolveBase("sezonlukdizi", CANDIDATES3, MARKER3, diag);
    if (!site)
      return [];
    const base = site.base;
    const H2 = { Referer: base + "/" };
    let cookie = site.cookie || "";
    const [info, asp] = yield Promise.all([trInfo(tmdbId, mediaType), getAsp(base, H2)]);
    const slug = yield findShow(base, info, H2, diag);
    if (!slug)
      return [];
    const s = season || 1;
    const e = episode || 1;
    const epUrl = `${base}/${slug}/${s}-sezon-${e}-bolum.html`;
    const ep = yield req(epUrl, { headers: Object.assign({}, H2, cookie ? { Cookie: cookie } : {}) });
    if (ep.cookie)
      cookie = cookie ? cookie + "; " + ep.cookie : ep.cookie;
    const bid = (ep.text.match(/id="dilsec"[^>]*data-id="(\d+)"/) || ep.text.match(/data-id="(\d+)"[^>]*id="dilsec"/) || [])[1];
    if (!bid) {
      diag && diag.fail(`b\xF6l\xFCm bulunamad\u0131 S${s}E${e} (${ep.status})`);
      return [];
    }
    diag && diag.step(`b\xF6l\xFCm \u2713 /${slug}/${s}-sezon-${e}-bolum (bid ${bid}, v${asp.alt})`);
    const AJ = Object.assign({ "X-Requested-With": "XMLHttpRequest", Referer: epUrl, Origin: base }, cookie ? { Cookie: cookie } : {});
    const langs = [];
    if (/data-dil="1"/.test(ep.text))
      langs.push({ dil: "1", tr: "altyazi" });
    if (/data-dil="0"/.test(ep.text))
      langs.push({ dil: "0", tr: "dublaj" });
    if (!langs.length)
      langs.push({ dil: "1", tr: "altyazi" });
    let altCount = 0;
    const lists = yield Promise.all(
      langs.map((L) => __async(this, null, function* () {
        const { json } = yield reqJson(`${base}/ajax/dataAlternatif${asp.alt}.asp`, { form: { bid, dil: L.dil }, headers: AJ });
        const alts = (json && json.status === "success" && Array.isArray(json.data) ? json.data : []).filter(
          (a) => !SKIP2.test(a.baslik || "")
        );
        altCount += alts.length;
        const res = yield Promise.all(
          alts.slice(0, MAX_ALT2).map((a) => __async(this, null, function* () {
            const r = yield req(`${base}/ajax/dataEmbed${asp.embed}.asp`, { form: { id: a.id }, headers: AJ });
            const ifr = (r.text.match(/<iframe[^>]+src=["']([^"']+)["']/i) || [])[1];
            if (!ifr)
              return [];
            const iframe = absUrl(ifr, base);
            const links = yield extractEmbed(iframe, base + "/");
            return links.map((l) => ({
              url: l.url,
              quality: l.quality !== "Auto" ? l.quality : qualityFromText(String(a.kalite || "") + " " + a.baslik, "Auto"),
              type: "direct",
              source: "sezonlukdizi",
              tr: L.tr,
              host: l.host || hostName(iframe),
              format: /\.m3u8/i.test(l.url) ? "HLS" : "MP4",
              headers: l.headers,
              subtitles: l.subtitles
            }));
          }))
        );
        return [].concat.apply([], res);
      }))
    );
    const out = [].concat.apply([], lists);
    if (diag) {
      if (!altCount)
        diag.fail("alternatif listesi bo\u015F (dataAlternatif)");
      else if (!out.length)
        diag.fail(`${altCount} alternatif var ama hi\xE7biri \xE7\xF6z\xFClemedi`);
      else
        diag.step(`${out.length} link (${altCount} alternatif)`);
    }
    return out;
  });
}

// src/ultra/lib/b64.js
var ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function b64urlEncode(str) {
  const bytes = utf8Encode(str);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const n = bytes[i] << 16 | (bytes[i + 1] || 0) << 8 | (bytes[i + 2] || 0);
    out += ABC[n >> 18 & 63] + ABC[n >> 12 & 63];
    if (i + 1 < bytes.length)
      out += ABC[n >> 6 & 63];
    if (i + 2 < bytes.length)
      out += ABC[n & 63];
  }
  return out.replace(/\+/g, "-").replace(/\//g, "_");
}
function b64decodeBytes(s) {
  const clean = String(s).replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+/]/g, "");
  const out = [];
  let buf = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    buf = buf << 6 | ABC.indexOf(clean[i]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push(buf >> bits & 255);
    }
  }
  return out;
}
function utf8Encode(str) {
  const out = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c >= 55296 && c <= 56319 && i + 1 < str.length) {
      c = 65536 + (c - 55296 << 10) + (str.charCodeAt(++i) - 56320);
    }
    if (c < 128)
      out.push(c);
    else if (c < 2048)
      out.push(192 | c >> 6, 128 | c & 63);
    else if (c < 65536)
      out.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
    else
      out.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
  }
  return out;
}
function utf8Decode(bytes, start) {
  let s = "";
  for (let i = start || 0; i < bytes.length; ) {
    const b = bytes[i++];
    let c;
    if (b < 128)
      c = b;
    else if (b < 224)
      c = (b & 31) << 6 | bytes[i++] & 63;
    else if (b < 240)
      c = (b & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
    else
      c = (b & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
    if (c > 65535) {
      c -= 65536;
      s += String.fromCharCode(55296 + (c >> 10), 56320 + (c & 1023));
    } else
      s += String.fromCharCode(c);
  }
  return s;
}

// src/ultra/sources/s111477.js
var ORIGIN = "https://st.111477.xyz";
var TMDB_KEY = "68e094699525b18a70bab2f86b1fa706";
var CONFIG = "https://a.111477.xyz/::sort=file-asc::limit=6::tmdb=" + TMDB_KEY + "::title=" + encodeURIComponent("{filename}|{size}|{resolution}|{server}");
var BASE2 = `${ORIGIN}/config/${b64urlEncode(CONFIG)}`;
function parseSize2(t) {
  const m = String(t || "").match(/([\d.]+)\s*(TB|GB|MB|GiB|MiB|TiB)/i);
  if (!m)
    return 0;
  const u2 = m[2].toUpperCase()[0];
  return parseFloat(m[1]) * (u2 === "T" ? 1e12 : u2 === "G" ? 1e9 : 1e6);
}
function fmtSize(b) {
  if (!b)
    return "";
  return b >= 1e9 ? (b / 1e9).toFixed(2) + " GB" : Math.round(b / 1e6) + " MB";
}
function qualityOf(t) {
  const s = String(t || "");
  if (/2160|4k|uhd/i.test(s))
    return "4K";
  if (/1440/.test(s))
    return "1440p";
  if (/1080/.test(s))
    return "1080p";
  if (/720/.test(s))
    return "720p";
  if (/576|480/.test(s))
    return "480p";
  return "1080p";
}
function get111477Streams(tmdbId, mediaType, season, episode, diag) {
  return __async(this, null, function* () {
    const info = yield getMediaInfo(tmdbId, mediaType);
    const isTv = info.isTv;
    const targets = [];
    if (info.imdbId)
      targets.push(info.imdbId);
    targets.push(`tmdb:${tmdbId}`);
    for (const target of targets) {
      const url = isTv ? `${BASE2}/stream/series/${target}:${season || 1}:${episode || 1}.json` : `${BASE2}/stream/movie/${target}.json`;
      const r = yield req(url, { headers: { Accept: "application/json" }, timeout: 15e3 });
      if (!r.ok) {
        diag && diag.fail(`eklenti cevap vermedi (${r.status || (r.timeout ? "zaman a\u015F\u0131m\u0131" : "ba\u011Flant\u0131 yok")})`);
        continue;
      }
      let json = null;
      try {
        json = JSON.parse(r.text);
      } catch (e) {
      }
      const items = json && json.streams || [];
      const blocked = items.find((x) => /slowdown|spammy|slow down/i.test((x.url || "") + " " + (x.title || "") + " " + (x.name || "")));
      if (blocked) {
        const t = (blocked.title || blocked.name || "").replace(/\s+/g, " ");
        diag && diag.fail(
          /spammy|banned/i.test(t) ? "IP engelli (VPN / datacenter). VPN'i kapat\u0131p tekrar dene" : "jeton bitti (5 dakikada 1 dolar), biraz bekle"
        );
        return [];
      }
      const out = [];
      items.forEach((x) => {
        if (!x || !/^https?:/.test(x.url || ""))
          return;
        const lines = String(x.title || x.description || "").split("\n").map((l) => l.trim());
        const bh = x.behaviorHints || {};
        const fileName = bh.filename || lines[0] || "";
        const bytes = bh.videoSize || parseSize2(lines[1] || x.title);
        const res = lines[2] || "";
        const headers = bh.proxyHeaders && bh.proxyHeaders.request;
        out.push({
          url: x.url,
          quality: qualityOf(res + " " + fileName),
          type: "direct",
          source: "111477",
          kind: "A111",
          server: lines[3] || "",
          size: fmtSize(bytes),
          bytes,
          fileName,
          headers: headers && Object.keys(headers).length ? headers : void 0
        });
      });
      if (out.length) {
        diag && diag.step(`${out.length} dosya (${target})`);
        return out;
      }
    }
    diag && diag.fail("ar\u015Fivde bu ba\u015Fl\u0131k yok");
    return [];
  });
}

// src/ultra/sources/movy.js
var API = "https://api.wecollege.net";
var UA2 = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
var H = { "User-Agent": UA2, Referer: "https://www.vidy.st/", Origin: "https://www.vidy.st", Accept: "application/json, text/plain, */*" };
var PLAY_HEADERS = { "User-Agent": UA2, Referer: "https://www.vidy.st/", Origin: "https://www.vidy.st" };
var SERVERS = [
  ["miami", "Miami"],
  ["boise", "Boise"],
  ["nashville", "Nashville", true],
  ["chicago", "Chicago", true],
  ["vegas", "Vegas"],
  ["dallas", "Dallas"],
  ["reno", "Reno"],
  ["oakland", "Oakland"],
  ["seattle", "Seattle"],
  ["phoenix", "Phoenix"],
  ["atlanta", "Atlanta"],
  ["portland", "Portland"],
  ["austin", "Austin"]
];
var BUDGET_MS = 2e4;
var MAX_RESULTS = 8;
var M32 = 4294967295;
var SLOTS = 61;
var MS = 2654435769;
var ACCX = 2779096485;
var u = (x) => x >>> 0;
var rotl = (v, n) => (n &= 31) ? u(v << n | v >>> 32 - n) : u(v);
function mix(l) {
  l = u(l ^ l >>> 16);
  l = u(Math.imul(l, 2246822507));
  l = u(l ^ l >>> 13);
  l = u(Math.imul(l, 3266489909));
  return u(l ^ l >>> 16);
}
function fnv(s) {
  let o = 2166136261;
  for (let i = 0; i < s.length; i++)
    o = u(Math.imul(u(o ^ s.charCodeAt(i)), 16777619));
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
    let g = u(acc ^ x | acc & x & neg);
    g = u(rotl(u(g + acc), r & 31) ^ rotl(acc, r * 7 & 31));
    acc = mix(u(g + MS));
    S[r] = acc;
    P[r] = true;
    return acc;
  };
}
function movyDecrypt(enc, seed, id) {
  const raw = b64decodeBytes(enc);
  const next = makeCipher(String(seed), Number(id));
  let cur = 0, off = 0;
  while (cur < raw.length) {
    const d = next(off++);
    for (let k = 0; k < 4 && cur < raw.length; k++)
      raw[cur++] ^= d >>> 8 * k & 255;
  }
  if (raw[0] !== 109 || raw[1] !== 118 || raw[2] !== 109 || raw[3] !== 49)
    throw new Error("movy: imza tutmad\u0131");
  return utf8Decode(raw, 4);
}
function describe(r) {
  if (!r)
    return "cevap yok";
  if (r.timeout)
    return "zaman a\u015F\u0131m\u0131";
  if (!r.status)
    return "ba\u011Flant\u0131 kurulamad\u0131";
  if (/cloudflare|attention required|just a moment|you have been blocked/i.test(r.text || ""))
    return `Cloudflare engeli (${r.status})`;
  return `HTTP ${r.status}`;
}
function quality(raw, url) {
  const s = String(raw || "");
  if (/4K|2160/.test(s) || /2160p/.test(url))
    return "4K";
  for (const q of ["1080", "720", "480", "360"])
    if (s.indexOf(q) !== -1)
      return q + "p";
  return "Auto";
}
var RANK = { "4K": 5, "1440p": 4.5, "1080p": 4, "720p": 3, "480p": 2, "360p": 1, Auto: 3.5 };
function fmtOf(url) {
  if (/\.mpd(\?|$)/.test(url))
    return "DASH";
  if (/\/mp4\/|\.mp4(\?|$)/.test(url) && !/\.m3u8/.test(url))
    return "MP4";
  return "HLS";
}
function buildCards(master, streams) {
  return __async(this, null, function* () {
    const probe = master || (fmtOf(streams[0].url) === "HLS" ? streams[0].url : null);
    if (probe) {
      const r = yield req(probe, { headers: PLAY_HEADERS, timeout: 6e3 });
      if (r.ok && /#EXT-X-STREAM-INF/.test(r.text || "")) {
        const best = {};
        parseM3U8(r.text, r.url || probe).forEach((v) => {
          if (!v.url || !v.resolution)
            return;
          const q = v.quality;
          if (!(q in RANK))
            return;
          if (!best[q] || (v.bandwidth || 0) > (best[q].bandwidth || 0))
            best[q] = v;
        });
        const qs = Object.keys(best);
        if (qs.length) {
          return qs.sort((a, b) => RANK[b] - RANK[a]).map((q) => {
            const v = best[q];
            const mb = v.bandwidth ? `  \xB7  ~${Math.max(1, Math.round(v.bandwidth / 1e6))} Mbps` : "";
            return { url: v.url, q, format: "HLS", note: `\u2705 Do\u011Fruland\u0131: ${v.resolution.replace("x", "\xD7")}${mb}` };
          });
        }
      }
    }
    const byQ = {};
    streams.forEach((s) => {
      if (!byQ[s.q])
        byQ[s.q] = s;
    });
    const cards = Object.keys(byQ).sort((a, b) => RANK[b] - RANK[a]).map((q) => ({ url: byQ[q].url, q, format: fmtOf(byQ[q].url), note: "\u2139\uFE0F Kalite sunucunun etiketi (do\u011Frulanamad\u0131)" }));
    if (master)
      cards.unshift({ url: master, q: "Auto", format: "HLS", note: "\u{1F504} Otomatik kalite (ba\u011Flant\u0131na g\xF6re)" });
    return cards;
  });
}
function getSeed(tmdbId) {
  return __async(this, null, function* () {
    let r = null;
    for (let t = 0; t < 2; t++) {
      r = yield req(`${API}/seed?mediaId=${tmdbId}`, { headers: H, timeout: 7e3 });
      try {
        const j = JSON.parse(r.text);
        if (j && j.seed)
          return { seed: String(j.seed), at: Date.now(), ttl: j.ttlMs || 3e4 };
      } catch (e) {
      }
      if (r.status === 403 || r.status === 0)
        break;
    }
    return { seed: null, r };
  });
}
function getMovyStreams(tmdbId, mediaType, season, episode, diag) {
  return __async(this, null, function* () {
    const t0 = Date.now();
    const info = yield getMediaInfo(tmdbId, mediaType);
    const isTv = info.isTv;
    const type = isTv ? "tv" : "movie";
    let S = yield getSeed(tmdbId);
    if (!S.seed) {
      diag && diag.fail(`1. ad\u0131m (seed) ba\u015Far\u0131s\u0131z: ${describe(S.r)}`);
      return [];
    }
    diag && diag.step("1. ad\u0131m (seed) \u2713");
    const title = info.title || info.originalTitle || "";
    const orig = info.originalTitle && info.originalTitle !== title ? info.originalTitle : "";
    const enc2 = (v) => encodeURIComponent(encodeURIComponent(v));
    const query = (alt, seed) => {
      const q = [
        "title=" + enc2(title),
        "mediaType=" + type,
        "year=" + (info.year || ""),
        "episodeId=" + (isTv ? episode || 1 : 1),
        "seasonId=" + (isTv ? season || 1 : 1),
        "tmdbId=" + tmdbId
      ];
      if (isTv)
        q.push("totalSeasons=" + (info.seasons || 1));
      if (info.imdbId)
        q.push("imdbId=" + info.imdbId);
      if (alt && orig)
        q.push("altTitle=" + enc2(orig));
      q.push("enc=2", "seed=" + encodeURIComponent(seed));
      return q.join("&");
    };
    const why = {};
    const note = (k) => why[k] = (why[k] || 0) + 1;
    const out = [];
    let tried = 0;
    let foundAt = null;
    for (const [shard, name, alt] of SERVERS) {
      if (foundAt || Date.now() - t0 > BUDGET_MS)
        break;
      tried++;
      if (Date.now() - S.at > S.ttl - 8e3) {
        const n = yield getSeed(tmdbId);
        if (n.seed)
          S = n;
      }
      let r = yield req(`${API}/${shard}/sources?${query(alt, S.seed)}`, { headers: H, timeout: 8e3 });
      if (r.status === 401) {
        const n = yield getSeed(tmdbId);
        if (n.seed) {
          S = n;
          r = yield req(`${API}/${shard}/sources?${query(alt, S.seed)}`, { headers: H, timeout: 8e3 });
        }
      }
      const enc = (r.text || "").trim();
      if (!r.ok) {
        note(describe(r));
        continue;
      }
      if (!enc) {
        note("bo\u015F cevap");
        continue;
      }
      let data;
      try {
        data = JSON.parse(movyDecrypt(enc, S.seed, tmdbId));
      } catch (e) {
        note(/imza/.test(String(e && e.message)) ? "\u015Fifre \xE7\xF6z\xFClemedi" : "bozuk veri");
        continue;
      }
      const seen = {};
      const streams = [];
      (data.sources || []).forEach((s) => {
        const url = s && (s.url || s.file);
        if (typeof url !== "string" || !/^https?:/.test(url) || seen[url])
          return;
        seen[url] = 1;
        streams.push({ url, q: quality(s.quality || s.label, url) });
      });
      if (!streams.length) {
        note("bu filmde link yok");
        continue;
      }
      streams.sort((a, b) => RANK[b.q] - RANK[a.q]);
      const master = typeof data.playlist === "string" && /^https?:/.test(data.playlist) ? data.playlist : null;
      const subs = (data.subtitles || data.tracks || []).filter((t) => t && (t.url || t.file)).slice(0, 8).map((t) => ({ url: t.url || t.file, language: t.lang || t.language || t.label || "en", name: t.label || t.lang || "Altyaz\u0131" }));
      const cards = yield buildCards(master, streams);
      cards.forEach(
        (c) => out.push({
          url: c.url,
          quality: c.q,
          type: "direct",
          source: "movy",
          server: name,
          format: c.format,
          note: c.note,
          headers: PLAY_HEADERS,
          subtitles: subs.length ? subs : void 0
        })
      );
      if (cards.length)
        foundAt = foundAt || name;
    }
    if (diag) {
      const sum = Object.keys(why).map((k) => `${why[k]}\xD7 ${k}`).join(", ");
      const secs = Math.round((Date.now() - t0) / 1e3);
      if (!out.length)
        diag.fail(`2. ad\u0131m (sunucular) ba\u015Far\u0131s\u0131z: ${sum || "cevap yok"} \xB7 ${tried} sunucu, ${secs} sn`);
      else
        diag.step(`${foundAt}: ${out.length} kalite (${tried} sunucu denendi, ${secs} sn)`);
    }
    return out.slice(0, MAX_RESULTS);
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
  torrentio: "Torrentio",
  filmmodu: "FilmModu",
  webteizle: "Webteizle",
  sezonlukdizi: "SezonlukDizi",
  "111477": "111477 Ar\u015Fiv",
  movy: "Movy"
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
  if (s.flaky)
    return "\u26A0\uFE0F Karars\u0131z sunucu  \xB7  Donabilir";
  switch (s.kind) {
    case "R2":
      return "\u26A1 Direkt  \xB7  Sar\u0131labilir";
    case "FSL":
      return "\u26A1 FSL  \xB7  Sar\u0131labilir";
    case "S3":
      return "\u26A1 S3  \xB7  Sar\u0131labilir";
    case "PIXEL":
      return s.bytes > 15e9 ? "\u{1F680} Google CDN  \xB7  \u26A0\uFE0F Sarma yok, tak\u0131labilir" : "\u{1F680} Google CDN  \xB7  Sarma s\u0131n\u0131rl\u0131";
    case "ZIPDISK":
      return "\u2601\uFE0F ZipDisk";
  }
  if (s.source === "111477")
    return "\u{1F4E6} Dev ar\u015Fiv  \xB7  Sar\u0131labilir";
  if (s.source === "movy")
    return `${s.format === "DASH" ? "\u{1F4FA} DASH" : s.format === "MP4" ? "\u{1F3AF} MP4" : "\u{1F4FA} HLS"}  \xB7  Sunucu ${s.server || "?"}`;
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
function speedLine(mbps) {
  if (mbps <= 25)
    return `\u{1F4F6} ~${mbps} Mbps gerekir  \xB7  \u{1F7E2} Rahat akar`;
  if (mbps <= 45)
    return `\u{1F4F6} ~${mbps} Mbps gerekir  \xB7  \u{1F7E1} \u0130yi Wi-Fi ister`;
  return `\u{1F4F6} ~${mbps} Mbps gerekir  \xB7  \u{1F534} Ak\u0131\u015F i\xE7in \xE7ok a\u011F\u0131r`;
}
function prettyTracker(raw) {
  if (!raw)
    return "";
  const key = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
  return TRACKER_NAMES[key] || raw;
}
function formatTr(s) {
  const q = s.quality || "Auto";
  const dub = s.tr === "dublaj";
  const name = (dub ? "\u{1F1F9}\u{1F1F7} " : "\u{1F4AC} ") + (q === "Auto" ? "HD" : q) + SEP + (dub ? "T\xFCrk\xE7e Dublaj" : "T\xFCrk\xE7e Altyaz\u0131l\u0131");
  const provider = PROVIDER_NAMES[s.source] || s.source || "";
  const lines = [];
  const l1 = [`\u{1F4E1} ${provider}`];
  l1.push(s.format === "MP4" ? "\u{1F3AF} MP4" : "\u{1F4FA} HLS");
  if (s.host && s.host !== provider)
    l1.push(`Sunucu ${s.host}`);
  lines.push(l1.join(SEP));
  if (dub)
    lines.push("\u{1F50A} T\xFCrk\xE7e ses");
  else if (s.subtitles && s.subtitles.length)
    lines.push("\u{1F4AC} T\xFCrk\xE7e altyaz\u0131 dosyas\u0131 otomatik eklenir");
  else
    lines.push("\u{1F4AC} Altyaz\u0131 videoya g\xF6m\xFCl\xFC");
  return { name, title: lines.join("\n") };
}
function formatStream(s) {
  if (s.tr)
    return formatTr(s);
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
  if (!isTorrent && s.mbps)
    lines.push(speedLine(s.mbps));
  if (s.note)
    lines.push(s.note);
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
  { id: "Torrentio", fn: getTorrentStreams, enabled: true, timeout: 12e3 },
  // Dev arşiv + Movy (ikisi de datacenter IP'lerini engelliyor; telefondan çalışır)
  { id: "111477", fn: get111477Streams, enabled: true, timeout: 18e3 },
  { id: "Movy", fn: getMovyStreams, enabled: true, timeout: 5e4 },
  // Türk siteleri (dublaj / altyazı)
  { id: "FilmModu", fn: getFilmModuStreams, enabled: true, timeout: 2e4 },
  { id: "Webteizle", fn: getWebteizleStreams, enabled: true, timeout: 25e3 },
  { id: "SezonlukDizi", fn: getSezonlukDiziStreams, enabled: true, timeout: 25e3 }
];
var TEST_TMDB = "603";
var TEST_TV_TMDB = "1396";
var MAX_DIRECT_PER_SOURCE_QUALITY = 4;
var MAX_TORRENTS_PER_QUALITY = 5;
var ALLOWED_TORRENT_QUALITIES = ["4K", "1440p", "1080p", "720p"];
function directScore(s) {
  if (s.source === "111477")
    return 48 - (s.mbps > 45 ? 30 : 0);
  if (s.source === "movy")
    return 36;
  if (s.kind) {
    if (s.flaky)
      return 5;
    const k = { R2: 50, FSL: 45, S3: 40, ZIPDISK: 25, PIXEL: 20 };
    let v = k[s.kind] || 10;
    if (s.kind === "PIXEL" && s.bytes > 15e9)
      v -= 12;
    if (s.mbps > 45)
      v -= 30;
    return v;
  }
  if (s.source === "vidlink")
    return 42;
  if (s.source === "vixsrc")
    return 38;
  if (s.source === "vidrock")
    return 30 + (s.prio || 0);
  if (s.tr) {
    const host = { "Ok.ru": 6, FilmModu: 6, VidMoly: 5, PlayerJS: 4, Sibnet: 3, FileMoon: 2, Dzen: 1 };
    return 20 + (s.tr === "dublaj" ? 10 : 0) + (host[s.host] || 0);
  }
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
    const key = s.source + "|" + s.quality + "|" + (s.tr || "");
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
    const isTest = String(tmdbId) === TEST_TMDB;
    if (isTest && (mediaType === "tv" || mediaType === "series")) {
      tmdbId = TEST_TV_TMDB;
      season = 1;
      episode = 1;
    }
    console.log(`[${tag}] \u0130stek: ${mediaType} tmdb=${tmdbId} s=${season} e=${episode}`);
    const active = SOURCES.filter((s) => s.enabled && (!sourceIds || sourceIds.indexOf(s.id) !== -1));
    const diags = {};
    const results = yield Promise.all(
      active.map((src) => {
        const started = Date.now();
        const diag = diags[src.id] = makeDiag(src.id);
        const p = Promise.resolve().then(() => src.fn(tmdbId, mediaType, season, episode, diag)).then((r) => {
          console.log(`[${tag}] ${src.id}: ${r.length} link (${Date.now() - started} ms)`);
          return r;
        }).catch((e) => {
          console.log(`[${tag}] ${src.id} hata: ${e && e.message}`);
          diag.fail(`hata: ${String(e && e.message || e).slice(0, 60)}`);
          return [];
        });
        return withTimeout(p, src.timeout, null).then((r) => {
          if (r === null)
            diag.fail(`s\xFCre doldu (${src.timeout / 1e3} sn)`);
          return r || [];
        });
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
    if (direct.some((s) => s.bytes)) {
      const info = yield withTimeout(getMediaInfo(tmdbId, mediaType).catch(() => null), 3e3, null);
      const min = info && info.runtime;
      if (min)
        direct.forEach((s) => {
          if (s.bytes)
            s.mbps = Math.round(s.bytes * 8 / (min * 60) / 1e6);
        });
    }
    direct = limitDirect(sortStreams(dedupe(direct)));
    torrents = limitTorrents(sortStreams(dedupe(torrents)));
    const all = sortStreams(direct.concat(torrents));
    const fourK = all.filter((s) => s.quality === "4K" && s.type !== "torrent").length;
    console.log(
      `[${tag}] Toplam ${all.length} (direkt ${direct.length}, 4K direkt ${fourK}, torrent ${torrents.length}) \u2014 ${Date.now() - t0} ms`
    );
    const out = all.map((s, i) => {
      const f = formatStream(s);
      const out2 = {
        name: rankPrefix(i) + f.name,
        title: f.title,
        // eski Nuvio sürümleri için
        quality: f.title,
        // yeni Nuvio bunu alt yazı olarak gösterir
        url: s.url
      };
      if (s.headers)
        out2.headers = s.headers;
      if (s.infoHash)
        out2.infoHash = s.infoHash;
      if (s.subtitles && s.subtitles.length)
        out2.subtitles = s.subtitles;
      return out2;
    });
    if (isTest || out.length === 0) {
      active.forEach((src, si) => {
        const d = diags[src.id];
        const gotAny = results[si] && results[si].length;
        if (gotAny || !d || !d.steps.length)
          return;
        d.steps.slice(-4).forEach((st, k) => {
          const msg = `\u{1F50D} ${src.id}: ${st.ok ? "\u2713" : "\u2717"} ${st.msg}`;
          out.push({ name: rankPrefix(60 + k) + msg, title: msg, quality: "\u2139\uFE0F Bilgi sat\u0131r\u0131: bu kaynak neden link vermedi", url: "https://teshis.invalid/" + encodeURIComponent(src.id) + "/" + k });
        });
      });
    }
    return out;
  });
}

// src/ultra4k/index.js
module.exports = { getStreams: makeGetStreams(["4KHDHub", "MoviesDrive"], "Ultra 4K") };
