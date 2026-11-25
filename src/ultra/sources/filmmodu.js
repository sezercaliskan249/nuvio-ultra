/**
 * FilmModu — Türkçe dublaj + altyazılı film VE dizi (HLS)
 *
 * 2026-11: Eski filmmodu.one'ın video sunucusu (imgsapi.pro) her istekte "404" döndürüyor.
 * Site yeni adrese taşındı: filmmodu.live -> filmmodu.icu (Pilavyer oynatıcı).
 *
 * Akış (yeni site):
 *   1. /film/<türkçe-slug>  veya  /dizi/<türkçe-slug>  (sayfadaki alternateName + yıl ile doğrulanır)
 *      bulunamazsa /ara?q=<isim> araması
 *   2. Dizi: /dizi/<slug>/sezon-S/bolum-E
 *   3. Sayfadaki <div data-pv="..."> + oynatıcı adresi (…/assets/js/core.js)
 *      -> <oynatıcı>/assets/js/s.php?s=<pv>  -> window.__PLAYER__ = {stream, audios, subs}
 *   4. stream = master m3u8 (token isteği yapan cihazın IP'sine bağlı; Nuvio isteği telefondan
 *      yaptığı için oynatma da telefondan sorunsuz olur). Ses: TR dublaj + orijinal, altyazı: .vtt
 *
 * Yedek: eski filmmodu.one (/get-source) — yalnızca liste gerçekten m3u8 ise kullanılır.
 */

import { trInfo, req, reqJson, slugify, norm, yearOk, absUrl, decodeHtml, qualityFromText, originOf } from "../tr/common.js";

const NEW_CANDIDATES = ["https://filmmodu.live", "https://filmmodu.icu"];
const OLD_BASE = "https://www.filmmodu.one";

let newBase = null;
let notFound = "";
async function resolveNew(diag) {
  if (newBase) return newBase;
  const reasons = [];
  for (const c of NEW_CANDIDATES) {
    const r = await req(c + "/", { timeout: 8000 });
    if (r.ok && /filmmodu/i.test(r.text) && /data-pv|\/film\/|\/dizi\//.test(r.text)) {
      newBase = originOf(r.url) || c;
      return newBase;
    }
    reasons.push(`${c.replace(/^https?:\/\//, "")} ${r.status || "bağlantı yok"}`);
  }
  notFound = `yeni site açılmadı (${reasons.join(", ")})`;
  return null;
}

function pageMeta(html) {
  const alt = decodeHtml((html.match(/"alternateName"\s*:\s*"([^"]*)"/) || [])[1] || "");
  const name = decodeHtml((html.match(/"name"\s*:\s*"([^"]*)"\s*,\s*"alternateName"/) || [])[1] || "");
  const y = parseInt((html.match(/"(?:datePublished|startDate)"\s*:\s*"(\d{4})/) || [])[1], 10) || 0;
  return { alt, name, year: y };
}

function matches(html, info) {
  const m = pageMeta(html);
  const titles = [info.titleOrig, info.titleEn, info.titleTr].filter(Boolean).map(norm);
  const nameOk = (m.alt && titles.indexOf(norm(m.alt)) !== -1) || (m.name && titles.indexOf(norm(m.name)) !== -1);
  return nameOk && yearOk(m.year, info.year);
}

async function findTitle(base, info, kind) {
  const H = { Referer: base + "/" };
  const slugs = [slugify(info.titleTr), slugify(info.titleOrig), slugify(info.titleEn)].filter((s, i, a) => s && a.indexOf(s) === i);
  for (const s of slugs) {
    const u = `${base}/${kind}/${s}`;
    const r = await req(u, { headers: H });
    if (r.ok && matches(r.text, info)) return { url: r.url || u, html: r.text };
  }
  // Arama
  const seen = {};
  for (const q of [info.titleTr, info.titleOrig].filter((t, i, a) => t && a.indexOf(t) === i)) {
    const r = await req(`${base}/ara?q=${encodeURIComponent(q)}`, { headers: H });
    if (!r.ok) continue;
    const re = new RegExp(`href="(https?://[^"]+/${kind}/[a-z0-9-]+|/${kind}/[a-z0-9-]+)"`, "g");
    const links = [];
    let m;
    while ((m = re.exec(r.text))) {
      const u = absUrl(m[1], base);
      if (!seen[u] && links.indexOf(u) === -1) links.push(u);
    }
    for (const u of links.slice(0, 3)) {
      seen[u] = 1;
      const p = await req(u, { headers: H });
      if (p.ok && matches(p.text, info)) return { url: p.url || u, html: p.text };
    }
  }
  return null;
}

async function playerFromPage(html, pageUrl) {
  const pv = (html.match(/data-pv="([^"]+)"/) || [])[1];
  if (!pv) return { why: "oynatıcı yok (data-pv)" };
  const host =
    originOf((html.match(/https?:\/\/[a-z0-9.-]*pilavyer[a-z0-9.-]*\/assets\/js\/core\.js/i) || [])[0]) ||
    originOf((html.match(/(https?:\/\/[^"'\s]+)\/assets\/js\/core\.js/i) || [])[1] + "/x") ||
    "https://pilavyerplay.top";
  const r = await req(`${host}/assets/js/s.php?s=${encodeURIComponent(pv)}`, { headers: { Referer: originOf(pageUrl) + "/" } });
  const m = r.text.match(/window\.__PLAYER__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/) || r.text.match(/window\.__PLAYER__\s*=\s*(\{.*?\});/);
  if (!m) {
    const t = ((r.text.match(/<title>([^<]{0,40})/i) || [])[1] || "").trim();
    return { why: `oynatıcı ${r.status || "bağlantı yok"}${t ? " '" + t + "'" : ""}` };
  }
  let d = null;
  try {
    d = JSON.parse(m[1]);
  } catch (e) {
    return { why: "oynatıcı verisi okunamadı" };
  }
  if (!d || !d.stream) return { why: "akış adresi yok" };
  return { d, host };
}

async function newSiteStreams(info, season, episode, diag) {
  const base = await resolveNew(diag);
  if (!base) return null;
  const kind = info.isTv ? "dizi" : "film";
  const found = await findTitle(base, info, kind);
  if (!found) {
    notFound = `${base.replace(/^https?:\/\//, "")}'da ${info.isTv ? "dizi" : "film"} yok`;
    return null;
  }
  let page = found;
  if (info.isTv) {
    const u = `${found.url.replace(/\/$/, "")}/sezon-${season}/bolum-${episode}`;
    const r = await req(u, { headers: { Referer: found.url } });
    if (!r.ok || !/data-pv=/.test(r.text)) {
      diag && diag.fail(`dizi ✓ ama S${season}E${episode} yok (${r.status})`);
      return [];
    }
    page = { url: r.url || u, html: r.text };
  }
  diag && diag.step(`${kind} ✓ ${page.url.replace(base, "")}`);

  const p = await playerFromPage(page.html, page.url);
  if (!p.d) {
    diag && diag.fail(p.why);
    return [];
  }
  const d = p.d;
  const headers = { Referer: p.host + "/" };

  // Kalite: master listesindeki en yüksek çözünürlük (aynı zamanda oynatılabilirlik kontrolü)
  let quality = "1080p";
  const mr = await req(d.stream, { headers, timeout: 8000 });
  if (mr.ok && /#EXTM3U/.test(mr.text)) {
    const hs = (mr.text.match(/RESOLUTION=\d+x(\d+)/g) || []).map((x) => parseInt(x.split("x")[1], 10));
    if (hs.length) quality = qualityFromText(Math.max.apply(null, hs) + "p", "1080p");
  } else if (mr.status) {
    diag && diag.fail(`akış listesi açılmadı (${mr.status})`);
    return [];
  }

  const audios = Array.isArray(d.audios) ? d.audios : [];
  const hasTrAudio = audios.some((a) => /^tr/i.test(a.lang || "") || /türkçe|turkce/i.test(a.label || ""));
  const subs = (Array.isArray(d.subs) ? d.subs : [])
    .filter((s) => s && s.src)
    .map((s) => Object.assign({ rank: (/^tr/i.test(s.lang || "") ? 0 : 2) + (/forced/i.test(s.label || "") ? 1 : 0) }, s))
    .sort((a, b) => a.rank - b.rank)
    .map((s) => ({ url: s.src, language: s.lang || "tr", name: s.label || "Türkçe" }));
  const hasTrSub = subs.some((s) => /^tr/i.test(s.language));

  const out = [
    {
      url: d.stream,
      quality,
      type: "direct",
      source: "filmmodu",
      tr: hasTrAudio ? (hasTrSub ? "ikili" : "dublaj") : "altyazi",
      audioNote: audios.length > 1 ? audios.map((a) => (/^tr/i.test(a.lang || "") ? "Türkçe Dublaj" : "Orijinal ses")).filter((x, i, arr) => arr.indexOf(x) === i).join(" + ") : "",
      host: "Pilavyer",
      format: "HLS",
      headers,
      subtitles: subs,
    },
  ];
  diag && diag.step(`1 link (${quality}${audios.length ? ", ses: " + audios.map((a) => a.lang || "?").join("+") : ""}${subs.length ? ", altyazı: " + subs.map((s) => s.language).join("+") : ""})`);
  return out;
}

// --- Yedek: eski filmmodu.one ------------------------------------------------
async function oldSiteStreams(info, diag) {
  const base = OLD_BASE;
  const H = { Referer: base + "/" };
  let card = null;
  if (info.imdbId) {
    const { json } = await reqJson(`${base}/search?query=${encodeURIComponent(info.imdbId)}`, {
      headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Accept: "application/json" }, H),
    });
    const list = json && Array.isArray(json.suggestions) ? json.suggestions.filter((x) => x && x.url) : [];
    if (list.length === 1) card = absUrl(list[0].url, base);
  }
  if (!card) return [];
  const page = await req(card, { headers: H });
  const vid = (page.text.match(/var videoId\s*=\s*'(\d+)'/) || [])[1];
  if (!vid) return [];
  const out = [];
  for (const ty of [{ t: "tr", tr: "dublaj" }, { t: "en", tr: "altyazi" }]) {
    const { json } = await reqJson(`${base}/get-source?movie_id=${vid}&type=${ty.t}`, {
      headers: { Referer: card, "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
    });
    if (!json || !Array.isArray(json.sources) || !json.sources.length) continue;
    // Ölü sunucu kontrolü: liste gerçekten m3u8 mi? (2026-11: "404" metni dönüyor)
    const probe = await req(json.sources[0].src, { headers: H, timeout: 6000 });
    if (!/#EXTM3U/.test(probe.text)) {
      diag && diag.step(`eski site video sunucusu ölü (${(probe.text || String(probe.status)).slice(0, 10).trim()})`);
      return [];
    }
    const subs = json.subtitle ? [{ url: absUrl(json.subtitle, base), language: "tr", name: "Türkçe" }] : [];
    json.sources
      .filter((s) => s && s.src)
      .forEach((s) =>
        out.push({
          url: s.src,
          quality: qualityFromText(s.label || s.res, "Auto"),
          type: "direct",
          source: "filmmodu",
          tr: ty.tr,
          host: "FilmModu",
          format: "HLS",
          headers: { Referer: base + "/", Origin: base },
          subtitles: subs,
        })
      );
  }
  return out.filter((s) => s.quality !== "360p");
}

export async function getFilmModuStreams(tmdbId, mediaType, season, episode, diag) {
  notFound = "";
  const info = await trInfo(tmdbId, mediaType);
  const fresh = await newSiteStreams(info, season || 1, episode || 1, diag);
  if (fresh && fresh.length) return fresh;
  if (fresh && !fresh.length) return []; // bulundu ama oynatıcı hatası: teşhis zaten yazıldı
  if (info.isTv) {
    diag && diag.fail(`dizi bulunamadı (${notFound})`);
    return [];
  }
  const old = await oldSiteStreams(info, diag);
  if (!old.length) diag && diag.fail(`film bulunamadı (${notFound}; eski site de boş)`);
  else diag && diag.step(`${old.length} link (eski site)`);
  return old;
}
