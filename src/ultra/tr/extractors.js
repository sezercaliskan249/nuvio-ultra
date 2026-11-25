/**
 * Gömülü video oynatıcı çözücüleri (Türk sitelerinin ortak kullandıkları)
 *
 *   extractEmbed(iframeUrl, referer) -> Promise<[{ url, quality, host, headers?, subtitles? }]>
 *
 * Desteklenenler: VidMoly, Ok.ru, Sibnet, FileMoon (packed JS), Dzen,
 * playerjs/hex linkler ve "file: ...m3u8" içeren genel oynatıcılar.
 */

import { req, UA, absUrl, originOf, decodeHtml, hexDecode, sleep, qualityFromText } from "./common.js";

export function hostName(url) {
  const u = String(url || "").toLowerCase();
  if (/vidmoly/.test(u)) return "VidMoly";
  if (/ok\.ru|odnoklassniki/.test(u)) return "Ok.ru";
  if (/sibnet/.test(u)) return "Sibnet";
  if (/filemoon|moonplayer|bf0skv|kerapoxy|z1ekv717|smdfs40r|be6721|boosteradx/.test(u)) return "FileMoon";
  if (/dzen\.ru|zen\.yandex/.test(u)) return "Dzen";
  if (/netu|hqq\.|waaw/.test(u)) return "Netu";
  return (originOf(u).replace(/^https?:\/\/(www\.)?/, "").split(".")[0] || "Video").replace(/^./, (c) => c.toUpperCase());
}

export async function extractEmbed(iframeUrl, referer) {
  const url = absUrl(decodeHtml(iframeUrl), referer);
  if (!url) return [];
  const h = hostName(url);
  try {
    if (/[?&]v=(\\x|%5Cx)?[0-9a-f]{20,}/i.test(url) && /playerjs|cstkcstk|vercel\.app|github\.io/i.test(url)) return hexParam(url);
    if (h === "VidMoly") return await vidmoly(url, referer);
    if (h === "Ok.ru") return await okru(url);
    if (h === "Sibnet") return await sibnet(url, referer);
    if (h === "FileMoon") return await filemoon(url, referer);
    if (h === "Dzen") return await dzen(url);
    if (h === "Netu") return []; // Netu: reklam/captcha, oynatılamıyor
    return await generic(url, referer, h);
  } catch (e) {
    console.log(`[Extract] ${h} hata: ${e && e.message}`);
    return [];
  }
}

// ---------------------------------------------------------------------------
function hexParam(url) {
  const m = url.match(/[?&]v=([^&]+)/);
  const dec = m && hexDecode(decodeURIComponent(m[1]));
  if (!dec || !/^https?:/i.test(dec)) return [];
  return [{ url: dec, quality: "Auto", host: "PlayerJS" }];
}

// --- VidMoly ----------------------------------------------------------------
async function vidmoly(url, referer) {
  // vidmoly.to / .me / .biz önce JS yönlendirme sayfası veriyor; .net doğrudan oynatıcıyı veriyor
  let u = url.replace(/\/w\/([a-z0-9]+)/i, "/embed-$1.html").replace(/\/\/(www\.)?vidmoly\.[a-z]+\//i, "//vidmoly.net/");
  const headers = { Referer: referer || "https://vidmoly.net/", "Sec-Fetch-Dest": "iframe" };
  let text = "";
  let finalUrl = u;
  for (let i = 0; i < 3; i++) {
    const r = await req(u, { headers, timeout: 8000 });
    text = r.text;
    finalUrl = r.url || u;
    if (/sources\s*:/.test(text)) break;
    const jsRedirect = (text.match(/location\.replace\(\s*['"]([^'"]+)['"]/) || [])[1];
    if (jsRedirect) {
      u = absUrl(jsRedirect, finalUrl);
      continue;
    }
    await sleep(600);
  }
  const m =
    text.match(/sources\s*:\s*\[\s*\{\s*file\s*:\s*["']([^"']+)["']/) ||
    text.match(/file\s*:\s*["'](https?:[^"']+\.m3u8[^"']*)["']/);
  if (!m) return [];
  const origin = originOf(finalUrl);
  const subs = [];
  const tr = text.match(/tracks\s*:\s*\[([\s\S]*?)\]/);
  if (tr) {
    const re = /file\s*:\s*["']([^"']+)["'][^}]*?label\s*:\s*["']([^"']+)["']/g;
    let t;
    while ((t = re.exec(tr[1]))) {
      if (/thumb|preview|sprite/i.test(t[1])) continue;
      subs.push({ url: absUrl(t[1], finalUrl), language: /t[uü]rk/i.test(t[2]) ? "tr" : t[2], name: t[2] });
    }
  }
  return [{ url: m[1], quality: "Auto", host: "VidMoly", headers: { Referer: origin + "/", Origin: origin }, subtitles: subs }];
}

// --- Ok.ru ------------------------------------------------------------------
const OK_Q = { mobile: "144p", lowest: "240p", low: "360p", sd: "480p", hd: "720p", full: "1080p", quad: "1440p", ultra: "4K" };

async function okru(url) {
  const id = (url.match(/(?:videoembed|video)\/(\d+)/) || [])[1];
  if (!id) return [];
  const r = await req("https://ok.ru/videoembed/" + id, { headers: { "User-Agent": UA }, timeout: 8000 });
  const m = r.text.match(/data-options="([^"]+)"/);
  if (!m) return [];
  let meta;
  try {
    const opts = JSON.parse(decodeHtml(m[1]));
    meta = opts.flashvars && opts.flashvars.metadata;
    if (typeof meta === "string") meta = JSON.parse(meta);
  } catch (e) {
    return [];
  }
  if (!meta || !meta.videos) return [];
  const vids = meta.videos
    .filter((v) => v && v.url && OK_Q[v.name])
    .map((v) => ({ url: absUrl(v.url, "https://ok.ru"), quality: OK_Q[v.name], host: "Ok.ru" }))
    .filter((v) => ["1080p", "720p", "480p", "4K", "1440p"].indexOf(v.quality) !== -1);
  // en iyi 2 kalite yeter
  return vids.reverse().slice(0, 2);
}

// --- Sibnet -----------------------------------------------------------------
async function sibnet(url, referer) {
  let shell = url;
  const id = (url.match(/videoid=(\d+)/) || url.match(/video(\d+)/) || [])[1];
  if (id) shell = "https://video.sibnet.ru/shell.php?videoid=" + id;
  const r = await req(shell, { headers: { Referer: referer || "https://video.sibnet.ru/" }, timeout: 8000 });
  const m = r.text.match(/player\.src\(\[\{\s*src\s*:\s*"([^"]+)"/) || r.text.match(/src\s*:\s*"(\/v\/[^"]+)"/);
  if (!m) return [];
  return [{ url: absUrl(m[1], "https://video.sibnet.ru"), quality: "Auto", host: "Sibnet", headers: { Referer: shell } }];
}

// --- FileMoon (eval packed) -------------------------------------------------
export function unpack(src) {
  const m = String(src).match(
    /eval\(function\(p,a,c,k,e,(?:r|d)\)\{[\s\S]*?\}\(\s*'([\s\S]*?)',\s*(\d+),\s*(\d+),\s*'([\s\S]*?)'\.split\('\|'\)/
  );
  if (!m) return null;
  let p = m[1].replace(/\\'/g, "'");
  const a = parseInt(m[2], 10);
  let c = parseInt(m[3], 10);
  const k = m[4].split("|");
  const enc = (n) => (n < a ? "" : enc(Math.floor(n / a))) + ((n = n % a) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  while (c--) if (k[c]) p = p.replace(new RegExp("\\b" + enc(c) + "\\b", "g"), k[c]);
  return p;
}

async function filemoon(url, referer) {
  const r = await req(url, { headers: { Referer: referer || url }, timeout: 8000 });
  let page = r.text;
  let pageUrl = r.url || url;
  const ifr = page.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (ifr && !/eval\(function\(p,a,c,k/.test(page)) {
    const u2 = absUrl(ifr[1], pageUrl);
    const r2 = await req(u2, { headers: { Referer: pageUrl, "Sec-Fetch-Dest": "iframe" }, timeout: 8000 });
    page = r2.text;
    pageUrl = r2.url || u2;
  }
  const js = unpack(page) || page;
  const m = js.match(/file\s*:\s*["'](https?:[^"']+\.m3u8[^"']*)["']/) || js.match(/["'](https?:[^"']+\.m3u8[^"']*)["']/);
  if (!m) return [];
  const origin = originOf(pageUrl);
  return [{ url: m[1], quality: "Auto", host: "FileMoon", headers: { Referer: origin + "/", Origin: origin } }];
}

// --- Dzen -------------------------------------------------------------------
async function dzen(url) {
  if (/\.m3u8/.test(url)) return [{ url, quality: "Auto", host: "Dzen" }];
  const r = await req(url, { timeout: 8000 });
  const t = r.text.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").replace(/\\u0026/gi, "&");
  const m = t.match(/(https:\/\/[^"'\s]+?\.m3u8[^"'\s]*)/);
  if (!m) return [];
  return [{ url: m[1], quality: "Auto", host: "Dzen" }];
}

// --- Genel oynatıcı ---------------------------------------------------------
async function generic(url, referer, host) {
  const r = await req(url, { headers: { Referer: referer || url }, timeout: 8000 });
  let t = r.text;
  const un = unpack(t);
  if (un) t += "\n" + un;
  const out = [];
  // 1) file: "...m3u8|mp4"
  let m = t.match(/["']?file["']?\s*:\s*["']([^"']+)["']/);
  if (m) {
    let f = m[1];
    if (/\\x[0-9a-f]{2}/i.test(f)) f = hexDecode(f) || f;
    if (/^(https?:)?\/\//.test(f) && /m3u8|mp4|\/hls\/|\/v\//i.test(f)) out.push(absUrl(f, r.url));
  }
  // 2) herhangi bir m3u8 adresi
  if (!out.length) {
    const m2 = t.replace(/\\\//g, "/").match(/(https?:\/\/[^"'\s<>]+?\.m3u8[^"'\s<>]*)/);
    if (m2) out.push(m2[1]);
  }
  if (!out.length) return [];
  // altyazılar (tracks = [{file, label}] veya "tracks":[...])
  const subs = [];
  const tr = t.match(/tracks["']?\s*[:=]\s*\[([\s\S]*?)\]/);
  if (tr) {
    const re = /["']?file["']?\s*:\s*["']([^"']+)["'][^}]*?["']?label["']?\s*:\s*["']([^"']+)["']/g;
    let s;
    while ((s = re.exec(tr[1]))) {
      const label = s[2].replace(/\\u0131/g, "ı").replace(/\\u0130/g, "İ").replace(/\\u00fc/g, "ü").replace(/\\u00e7/g, "ç");
      if (/forced|thumb/i.test(label)) continue;
      subs.push({ url: absUrl(s[1].replace(/\\\//g, "/").replace(/\\/g, ""), r.url), language: /t[uü]rk/i.test(label) ? "tr" : label, name: label });
    }
  }
  const origin = originOf(r.url || url);
  return out.map((u) => ({
    url: u,
    quality: qualityFromText(u, "Auto"),
    host,
    headers: { Referer: origin + "/", Origin: origin },
    subtitles: subs,
  }));
}
