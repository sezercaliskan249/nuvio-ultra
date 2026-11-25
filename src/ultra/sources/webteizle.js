/**
 * Webteizle (webteizle.info) — Türkçe dublaj + altyazılı filmler
 *
 * Akış:
 *   1. /izle/altyazi/<slug> ve /izle/dublaj/<slug> (slug = orijinal isim)  — sayfadaki IMDb ile doğrulanır
 *      bulunamazsa /ajax/arama.asp araması
 *   2. #dilsec data-id = film ID, sayfada hangi diller var
 *   3. POST /ajax/dataAlternatif3.asp {filmid, dil, s, b, bot:0} -> alternatif listesi
 *   4. POST /ajax/dataEmbed.asp {id} -> iframe / vidmoly('id') vb. -> extractor
 */

import { trInfo, req, reqJson, resolveBase, slugify, norm, yearOk, absUrl, qualityFromText } from "../tr/common.js";
import { extractEmbed, hostName } from "../tr/extractors.js";

const CANDIDATES = ["https://webteizle.info", "https://webteizle3.xyz", "https://webteizle2.com", "https://webteizle.org"];
const MARKER = /webteizle/i;
const SKIP = /netu|uptobox|streamsb|fragman|youtube/i;
const MAX_ALT = 6;

let aspVer = null;

function pageMatches(html, info) {
  const imdb = (html.match(/imdb\.com\/title\/(tt\d+)/) || [])[1];
  if (imdb && info.imdbId) return imdb === info.imdbId;
  const y = parseInt((html.match(/"datePublished":"(\d{4})/) || html.match(/\((\d{4})\)/) || [])[1], 10);
  return yearOk(y, info.year);
}

async function findFilm(base, info, H, diag) {
  const slugs = [slugify(info.titleOrig), slugify(info.titleTr)].filter((s, i, a) => s && a.indexOf(s) === i);
  const cands = [];
  slugs.forEach((s) => {
    cands.push(`${base}/izle/altyazi/${s}`, `${base}/izle/dublaj/${s}`);
  });
  for (let i = 0; i < cands.length; i += 2) {
    const rs = await Promise.all([req(cands[i], { headers: H }), cands[i + 1] ? req(cands[i + 1], { headers: H }) : null]);
    for (const r of rs) {
      if (r && r.ok && /id="dilsec"/.test(r.text) && pageMatches(r.text, info)) return { url: r.url || cands[i], html: r.text };
    }
  }
  // Arama
  for (const q of [info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i)) {
    const { json } = await reqJson(`${base}/ajax/arama.asp`, {
      form: { q },
      headers: Object.assign({ "X-Requested-With": "XMLHttpRequest" }, H),
    });
    const items = [];
    if (json && json.results) {
      Object.keys(json.results).forEach((k) => {
        const g = json.results[k];
        (g && g.results ? g.results : []).forEach((it) => items.push(it));
      });
    }
    const pick =
      items.find((it) => norm(it.title || it.name).indexOf(norm(info.titleOrig)) === 0) ||
      items.find((it) => norm(it.title || it.name).indexOf(norm(info.titleTr)) === 0);
    if (pick && pick.url) {
      const u = absUrl(pick.url, base);
      const r = await req(u, { headers: H });
      if (r.ok && /id="dilsec"/.test(r.text) && pageMatches(r.text, info)) return { url: r.url || u, html: r.text };
    }
  }
  diag && diag.fail(`film bulunamadı (${slugs[0] || "?"})`);
  return null;
}

async function getAlternatives(base, filmId, dil, H, referer) {
  const tryVer = async (v) => {
    const { json } = await reqJson(`${base}/ajax/dataAlternatif${v}.asp`, {
      form: { filmid: filmId, dil, s: "", b: "", bot: 0 },
      headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Referer: referer, Origin: base }, H),
    });
    return json;
  };
  let json = await tryVer(aspVer || "3");
  if (!json && !aspVer) {
    // Sürüm numarası değişmiş olabilir -> site.min.js'ten oku
    const js = await req(`${base}/js/site.min.js`, { headers: H });
    const v = (js.text.match(/dataAlternatif(\d*)\.asp/) || [])[1];
    if (v != null && v !== "3") {
      aspVer = v;
      json = await tryVer(v);
    }
  }
  return json && json.status === "success" && Array.isArray(json.data) ? json.data : [];
}

async function embedToIframe(base, id, H, referer) {
  const r = await req(`${base}/ajax/dataEmbed.asp`, {
    form: { id },
    headers: Object.assign({ "X-Requested-With": "XMLHttpRequest", Referer: referer, Origin: base }, H),
  });
  const t = r.text;
  const ifr = t.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (ifr) return absUrl(ifr[1], base);
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
}

export async function getWebteizleStreams(tmdbId, mediaType, season, episode, diag) {
  if (mediaType === "tv" || mediaType === "series") return [];
  const site = await resolveBase("webteizle", CANDIDATES, MARKER, diag);
  if (!site) return [];
  const base = site.base;
  const H = { Referer: base + "/" };
  if (site.cookie) H.Cookie = site.cookie;

  const info = await trInfo(tmdbId, mediaType);
  const film = await findFilm(base, info, H, diag);
  if (!film) return [];
  const filmId = (film.html.match(/id="dilsec"[^>]*data-id="(\d+)"/) || film.html.match(/id="wip"[^>]*data-id="(\d+)"/) || [])[1];
  if (!filmId) {
    diag && diag.fail("film ID okunamadı");
    return [];
  }
  diag && diag.step(`film ✓ ${film.url.replace(base, "")} (id ${filmId})`);

  const langs = [];
  if (/data-dil="0"/.test(film.html) || /\/izle\/dublaj\//.test(film.html)) langs.push({ dil: "0", tr: "dublaj" });
  if (/data-dil="1"/.test(film.html) || /\/izle\/altyazi\//.test(film.html)) langs.push({ dil: "1", tr: "altyazi" });
  if (!langs.length) langs.push({ dil: "1", tr: "altyazi" }, { dil: "0", tr: "dublaj" });

  let altCount = 0;
  const lists = await Promise.all(
    langs.map(async (L) => {
      const alts = (await getAlternatives(base, filmId, L.dil, H, film.url)).filter((a) => !SKIP.test(a.baslik || ""));
      altCount += alts.length;
      const res = await Promise.all(
        alts.slice(0, MAX_ALT).map(async (a) => {
          const iframe = await embedToIframe(base, a.id, H, film.url);
          if (!iframe) return [];
          const links = await extractEmbed(iframe, film.url);
          return links.map((l) => ({
            url: l.url,
            quality: l.quality !== "Auto" ? l.quality : qualityFromText(a.baslik + " " + (a.kalite || ""), "1080p"),
            type: "direct",
            source: "webteizle",
            tr: L.tr,
            host: l.host || hostName(iframe),
            format: /\.m3u8/i.test(l.url) ? "HLS" : "MP4",
            headers: l.headers,
            subtitles: l.subtitles,
          }));
        })
      );
      return [].concat.apply([], res);
    })
  );
  const out = [].concat.apply([], lists);
  if (diag) {
    if (!altCount) diag.fail("alternatif listesi boş (dataAlternatif)");
    else if (!out.length) diag.fail(`${altCount} alternatif var ama hiçbiri çözülemedi`);
    else diag.step(`${out.length} link (${altCount} alternatif)`);
  }
  return out;
}
