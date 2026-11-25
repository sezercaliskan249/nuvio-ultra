/**
 * SezonlukDizi (sezonlukdizi.cc) — Türkçe altyazılı + dublaj diziler
 *
 * Akış:
 *   1. Dizi sayfası: /diziler/<slug>.html  (slug = orijinal / Türkçe isim), yoksa /ajax/arama.asp
 *   2. Bölüm sayfası: /<slug>/<S>-sezon-<E>-bolum.html  -> #dilsec data-id (bid)
 *   3. /js/site.min.js içinden güncel dataAlternatifNN / dataEmbedNN numarası
 *   4. POST /ajax/dataAlternatifNN.asp {bid, dil: 1=altyazı 0=dublaj} -> alternatifler
 *   5. POST /ajax/dataEmbedNN.asp {id} -> iframe -> extractor (VidMoly, Ok.ru, Sibnet, FileMoon, Dzen)
 */

import { trInfo, req, reqJson, resolveBase, slugify, norm, absUrl, qualityFromText } from "../tr/common.js";
import { extractEmbed, hostName } from "../tr/extractors.js";

// Güncel adres (kullanıcı teyitli)
const CANDIDATES = ["https://sezonlukdizi.cc"];
const MARKER = /sezonlukdizi/i;
const SKIP = /netu|pixel/i;
const MAX_ALT = 6;

let aspCache = null;

async function getAsp(base, H) {
  if (aspCache) return aspCache;
  const r = await req(`${base}/js/site.min.js`, { headers: H });
  aspCache = {
    alt: (r.text.match(/dataAlternatif(\d*)\.asp/) || [])[1] || "22",
    embed: (r.text.match(/dataEmbed(\d*)\.asp/) || [])[1] || "22",
  };
  return aspCache;
}

const NOT_FOUND = /Sayfa Bulunamad|Haydaaa|404 Not Found/i;

// Dizi sayfasından bölüm URL'lerinde kullanılan slug'ı oku. IMDb tutmuyorsa (başka dizi) null.
function readShowPage(html, info, fallback) {
  if (!html || NOT_FOUND.test(html)) return null;
  const imdb = (html.match(/imdb\.com\/title\/(tt\d+)/i) || [])[1];
  if (imdb && info.imdbId && imdb !== info.imdbId) return null;
  const dizi = (html.match(/data-dizi="([^"]+)"/) || [])[1];
  const ep = (html.match(/href="\/([^/"]+)\/\d+-sezon-\d+-bolum\.html/i) || [])[1];
  if (dizi || ep) return dizi || ep;
  return /sezonlukdizi/i.test(html) && /class="[^"]*imdb/.test(html) ? fallback : null;
}

async function findShow(base, info, H, diag) {
  const titles = [info.titleEn, info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i);
  const slugs = titles.map(slugify).filter((s, i, a) => s && a.indexOf(s) === i);
  // 1) Doğrudan dizi sayfası (sırayla; Nuvio'da istekler zaten sırayla gidiyor)
  for (const s of slugs) {
    const r = await req(`${base}/diziler/${s}.html`, { headers: H });
    const slug = r.ok ? readShowPage(r.text, info, s) : null;
    if (slug) {
      diag && diag.step(`dizi ✓ /diziler/${s}.html`);
      return slug;
    }
  }
  // 2) Sitenin kendi araması (IMDb ID ile de arıyor: "Dizi, Oyuncu, Imdb id")
  const queries = (info.imdbId ? [info.imdbId] : []).concat(titles.slice(0, 2));
  let seen = 0;
  for (const q of queries) {
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
    const shows = items.filter((it) => /\/diziler\/[^/.]+\.html/.test(String(it.url || "")));
    seen += shows.length;
    const nm = (it) => norm(it.title || it.name || "");
    const pick =
      (q === info.imdbId ? shows[0] : null) ||
      shows.find((it) => titles.some((t) => nm(it) === norm(t))) ||
      shows.find((it) => titles.some((t) => nm(it).indexOf(norm(t)) === 0)) ||
      (shows.length === 1 ? shows[0] : null);
    if (!pick) continue;
    const s = String(pick.url).match(/\/diziler\/([^/.]+)\.html/)[1];
    const r = await req(`${base}/diziler/${s}.html`, { headers: H });
    const slug = readShowPage(r.text, info, s);
    if (slug) {
      diag && diag.step(`dizi ✓ arama "${q}" → ${s}`);
      return slug;
    }
  }
  diag && diag.fail(`dizi bulunamadı (denendi: ${slugs.join(", ") || "?"} · arama: ${seen} sonuç)`);
  return null;
}

export async function getSezonlukDiziStreams(tmdbId, mediaType, season, episode, diag) {
  if (!(mediaType === "tv" || mediaType === "series")) return [];
  const site = await resolveBase("sezonlukdizi", CANDIDATES, MARKER, diag);
  if (!site) return [];
  const base = site.base;
  const H = { Referer: base + "/" };
  let cookie = site.cookie || "";

  const [info, asp] = await Promise.all([trInfo(tmdbId, mediaType), getAsp(base, H)]);
  const slug = await findShow(base, info, H, diag);
  if (!slug) return [];

  const s = season || 1;
  const e = episode || 1;
  const epUrl = `${base}/${slug}/${s}-sezon-${e}-bolum.html`;
  const ep = await req(epUrl, { headers: Object.assign({}, H, cookie ? { Cookie: cookie } : {}) });
  if (ep.cookie) cookie = cookie ? cookie + "; " + ep.cookie : ep.cookie;
  const bid = (ep.text.match(/id="dilsec"[^>]*data-id="(\d+)"/) || ep.text.match(/data-id="(\d+)"[^>]*id="dilsec"/) || [])[1];
  if (!bid) {
    diag && diag.fail(`bölüm bulunamadı S${s}E${e} (${ep.status})`);
    return [];
  }
  diag && diag.step(`bölüm ✓ /${slug}/${s}-sezon-${e}-bolum (bid ${bid}, v${asp.alt})`);

  const AJ = Object.assign({ "X-Requested-With": "XMLHttpRequest", Referer: epUrl, Origin: base }, cookie ? { Cookie: cookie } : {});
  const langs = [];
  if (/data-dil="1"/.test(ep.text)) langs.push({ dil: "1", tr: "altyazi" });
  if (/data-dil="0"/.test(ep.text)) langs.push({ dil: "0", tr: "dublaj" });
  if (!langs.length) langs.push({ dil: "1", tr: "altyazi" });

  let altCount = 0;
  const lists = await Promise.all(
    langs.map(async (L) => {
      const { json } = await reqJson(`${base}/ajax/dataAlternatif${asp.alt}.asp`, { form: { bid, dil: L.dil }, headers: AJ });
      const alts = (json && json.status === "success" && Array.isArray(json.data) ? json.data : []).filter(
        (a) => !SKIP.test(a.baslik || "")
      );
      altCount += alts.length;
      const res = await Promise.all(
        alts.slice(0, MAX_ALT).map(async (a) => {
          const r = await req(`${base}/ajax/dataEmbed${asp.embed}.asp`, { form: { id: a.id }, headers: AJ });
          const ifr = (r.text.match(/<iframe[^>]+src=["']([^"']+)["']/i) || [])[1];
          if (!ifr) return [];
          const iframe = absUrl(ifr, base);
          const links = await extractEmbed(iframe, base + "/");
          return links.map((l) => ({
            url: l.url,
            quality: l.quality !== "Auto" ? l.quality : qualityFromText(String(a.kalite || "") + " " + a.baslik, "Auto"),
            type: "direct",
            source: "sezonlukdizi",
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
