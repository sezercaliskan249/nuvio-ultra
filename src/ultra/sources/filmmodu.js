/**
 * FilmModu (filmmodu.one) — Türkçe dublaj + Türkçe altyazılı filmler (HLS, 1080p/720p)
 *
 * Akış:
 *   1. /film-ara?term=<IMDb ID>  (site IMDb ile aramayı destekliyor -> kesin eşleşme)
 *      bulunamazsa orijinal / Türkçe isimle arama + yıl kontrolü
 *   2. Film sayfasından `var videoId` ve dublaj/altyazı seçenekleri
 *   3. /get-source?movie_id=ID&type=tr (dublaj) | en (altyazı) -> m3u8 listesi + .vtt altyazı
 */

import { trInfo, req, reqJson, resolveBase, norm, yearOk, absUrl, decodeHtml, qualityFromText } from "../tr/common.js";

const CANDIDATES = ["https://www.filmmodu.one", "https://www.filmmodu.com"];
const MARKER = /filmmodu/i;

function parseCards(html, base) {
  const out = [];
  const re = /<div class="col-md-2 col-xs-6 movie">([\s\S]*?)<p class="bottom">/g;
  let m;
  while ((m = re.exec(html))) {
    const b = m[1];
    const href = (b.match(/<a href="([^"]+-film-izle)"/) || [])[1];
    if (!href) continue;
    out.push({
      url: absUrl(href, base),
      orig: decodeHtml((b.match(/class="original-name">([^<]*)/) || [])[1] || ""),
      tr: decodeHtml((b.match(/class="turkish-name">([^<]*)/) || [])[1] || ""),
      year: parseInt((b.match(/class="top">\s*(\d{4})/) || [])[1], 10) || 0,
    });
  }
  return out;
}

// /search = sitenin otomatik tamamlama API'si (IMDb ID ile de çalışır, /film-ara'dan güvenilir)
async function suggest(base, term, H) {
  const { json } = await reqJson(`${base}/search?query=${encodeURIComponent(term)}`, {
    headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Accept: "application/json" }, H),
  });
  return json && Array.isArray(json.suggestions)
    ? json.suggestions.filter((x) => x && x.url).map((x) => ({ url: absUrl(x.url, base), orig: x.value || "", tr: x.turkish_name || "" }))
    : [];
}

// Yedek: /film-ara HTML araması (yıl bilgisi de var)
async function search(base, term, H) {
  const r = await req(`${base}/film-ara?term=${encodeURIComponent(term)}`, { headers: H });
  return r.ok ? parseCards(r.text, base) : [];
}

export async function getFilmModuStreams(tmdbId, mediaType, season, episode, diag) {
  if (mediaType === "tv" || mediaType === "series") return [];
  const site = await resolveBase("filmmodu", CANDIDATES, MARKER, diag);
  if (!site) return [];
  const base = site.base;
  const H = { Referer: base + "/" };

  const info = await trInfo(tmdbId, mediaType);

  // 1) IMDb ile ara (kesin), 2) isimle ara (yıl sayfada kontrol edilir)
  const same = (c) => norm(c.orig) === norm(info.titleOrig) || (c.tr && norm(c.tr) === norm(info.titleTr));
  let card = null;
  let checkYear = false;
  if (info.imdbId) {
    const list = await suggest(base, info.imdbId, H);
    card = list.length === 1 ? list[0] : list.find(same) || null;
  }
  if (!card) {
    checkYear = true;
    const terms = [info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i);
    for (const t of terms) {
      card = (await suggest(base, t, H)).find(same) || null;
      if (!card) card = (await search(base, t, H)).find((c) => same(c) && yearOk(c.year, info.year)) || null;
      if (card) break;
    }
  }
  if (!card) {
    diag && diag.fail(`film bulunamadı (${info.titleOrig || info.titleTr} ${info.year})`);
    return [];
  }
  diag && diag.step(`film ✓ ${card.url.replace(base, "")}`);

  const page = await req(card.url, { headers: H });
  const vid = (page.text.match(/var videoId\s*=\s*'(\d+)'/) || [])[1];
  if (!vid) {
    diag && diag.fail(`film sayfası açılmadı (${page.status})`);
    return [];
  }
  if (checkYear) {
    const y = parseInt((page.text.match(/itemprop="dateCreated">\s*(\d{4})/) || [])[1], 10);
    if (!yearOk(y, info.year)) {
      diag && diag.fail(`yıl tutmadı (${y} ≠ ${info.year})`);
      return [];
    }
  }
  const types = [];
  if (/-turkce-dublaj-film-izle"/.test(page.text) || /var videoType\s*=\s*'tr'/.test(page.text)) types.push({ t: "tr", tr: "dublaj" });
  if (/-altyazili-film-izle"/.test(page.text) || /var videoType\s*=\s*'en'/.test(page.text)) types.push({ t: "en", tr: "altyazi" });
  if (!types.length) types.push({ t: "en", tr: "altyazi" }, { t: "tr", tr: "dublaj" });

  const lists = await Promise.all(
    types.map(async (ty) => {
      const { json } = await reqJson(`${base}/get-source?movie_id=${vid}&type=${ty.t}`, {
        headers: { Referer: card.url, "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
      });
      if (!json || !Array.isArray(json.sources)) return [];
      const subs = json.subtitle ? [{ url: absUrl(json.subtitle, base), language: "tr", name: "Türkçe" }] : [];
      return json.sources
        .filter((s) => s && s.src)
        .map((s) => {
          let u = s.src;
          if (!/\.m3u8/.test(u) && /mpegurl/i.test(s.type || "")) u += ".m3u8";
          return {
            url: u,
            quality: qualityFromText(s.label || s.res, "Auto"),
            type: "direct",
            source: "filmmodu",
            tr: ty.tr,
            host: "FilmModu",
            format: "HLS",
            headers: { Referer: base + "/", Origin: base },
            subtitles: subs,
          };
        });
    })
  );
  const out = [].concat.apply([], lists).filter((s) => s.quality !== "360p");
  diag && (out.length ? diag.step(`${out.length} link`) : diag.fail("get-source boş döndü"));
  return out;
}
