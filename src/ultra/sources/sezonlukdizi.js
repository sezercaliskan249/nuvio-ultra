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

// Cevap vermeyen adresler çıkarıldı: sezonlukdizi6.com (askıda kalıyor), sezonlukdizi7.com (DNS yok)
const CANDIDATES = ["https://sezonlukdizi.cc", "https://sezonlukdizi8.com"];
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

async function findShow(base, info, H, diag) {
  const slugs = [slugify(info.titleOrig), slugify(info.titleTr)].filter((s, i, a) => s && a.indexOf(s) === i);
  const rs = await Promise.all(slugs.map((s) => req(`${base}/diziler/${s}.html`, { headers: H })));
  for (let i = 0; i < rs.length; i++) {
    const r = rs[i];
    if (!r.ok || /Sayfa Bulunamad|Haydaaa/i.test(r.text)) continue;
    // Bölüm linklerinden gerçek slug'ı al
    const m = r.text.match(/href="\/([^/"]+)\/\d+-sezon-\d+-bolum\.html/i);
    const yearHit = !info.year || r.text.indexOf(String(info.year)) !== -1;
    if (m && yearHit) return m[1];
    if (m) return m[1];
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
      items.find((it) => norm(it.title || it.name) === norm(info.titleOrig)) ||
      items.find((it) => norm(it.title || it.name) === norm(info.titleTr)) ||
      items.find((it) => norm(it.title || it.name).indexOf(norm(info.titleOrig)) === 0);
    const m = pick && String(pick.url || "").match(/\/diziler\/([^/.]+)\.html/);
    if (m) return m[1];
  }
  diag && diag.fail(`dizi bulunamadı (${slugs[0] || "?"})`);
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
