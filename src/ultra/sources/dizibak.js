/**
 * DiziBak — Türkçe altyazılı yabancı diziler (altyazı videoya gömülü, 720p HLS)
 *
 * dizibak.com Cloudflare arkasında; dizibak.net ve player.dizibak.net açık (captcha yok).
 *
 * NEDEN WordPress REST API: sitenin her HTML sayfası ~1.1 MB (menüde bütün diziler var) ve
 * gereken bilgi (oynatıcı anahtarı vb.) sayfanın en sonunda. Nuvio Android eklenti
 * isteklerini 1 MB'ta kesiyor -> HTML yolu Android'de hiç çalışmaz. REST API cevapları 1-2 KB.
 *
 * Akış:
 *   1. /wp-json/wp/v2/search?type=term&subtype=category&search=<isim>  -> dizi (kategori) + slug
 *   2. /wp-json/wp/v2/posts?slug=<slug>-S-sezon-E-bolum               -> içerikteki <iframe>
 *      (bulunamazsa kategori içinde "S. Sezon E. Bölüm" araması)
 *   3. player.dizibak.net/embed/<id>.mp4 (eval packed JS) -> file: "...m3u8"
 * Video *.d1iz-b0ok.xyz üzerinde; Referer player.dizibak.net ister.
 */

import { trInfo, req, reqJson, norm, absUrl, whyFailed, qualityFromText, decodeHtml, slugify } from "../tr/common.js";
import { unpack } from "../tr/extractors.js";

const BASE = "https://dizibak.net";
const API = BASE + "/wp-json/wp/v2";
const PLAYER = "https://player.dizibak.net";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const JH = { "User-Agent": UA, Accept: "application/json", Referer: BASE + "/" };

async function findShow(info, diag) {
  const names = [info.titleEn, info.titleOrig, info.titleTr].filter((t, i, a) => t && a.indexOf(t) === i);
  const wanted = names.map(norm);
  for (const q of names) {
    const { r, json } = await reqJson(`${API}/search?type=term&subtype=category&per_page=20&search=${encodeURIComponent(q)}`, { headers: JH, timeout: 9000 });
    if (!Array.isArray(json)) {
      if (r && !r.ok) {
        diag && diag.fail(`site açılmadı (${whyFailed(r)})`);
        return null;
      }
      continue;
    }
    const list = json.filter((x) => x && /\/diziler\/[^/]+/.test(x.url || ""));
    const hit = list.find((x) => wanted.indexOf(norm(decodeHtml(x.title))) !== -1);
    if (hit) return { id: hit.id, slug: (hit.url.match(/\/diziler\/([^/]+)/) || [])[1], title: decodeHtml(hit.title) };
  }
  diag && diag.fail(`dizi bulunamadı (${names[0] || "?"})`);
  return null;
}

async function findEpisode(show, s, e, triedSlug) {
  const F = "&_fields=id,title,link,content";
  const { json } = show.slug === triedSlug ? { json: null } : await reqJson(`${API}/posts?slug=${encodeURIComponent(`${show.slug}-${s}-sezon-${e}-bolum`)}${F}`, { headers: JH, timeout: 9000 });
  if (Array.isArray(json) && json[0]) return json[0];
  // Yedek: "final" vb. farklı adresler -> dizinin kategorisinde ara, başlıktan doğrula
  const { json: j2 } = await reqJson(`${API}/posts?categories=${show.id}&per_page=20&search=${encodeURIComponent(`${s}. Sezon ${e}. Bölüm`)}${F}`, { headers: JH, timeout: 9000 });
  const re = new RegExp(`(^|\\D)${s}\\. Sezon ${e}\\. B`, "i");
  return (Array.isArray(j2) && j2.find((p) => p && p.title && re.test(decodeHtml(p.title.rendered || "")))) || null;
}

/** Arama yapmadan bölüm yazısını slug tahminiyle bulur; başlıktan dizi adını doğrular. */
async function guessEpisode(info, s, e) {
  const names = [info.titleEn, info.titleOrig].filter((t, i, a) => t && /[a-z]/i.test(t) && a.indexOf(t) === i);
  const name = names[0];
  const slug = name && slugify(name);
  if (!slug) return null;
  const { json } = await reqJson(`${API}/posts?slug=${encodeURIComponent(`${slug}-${s}-sezon-${e}-bolum`)}&_fields=id,title,link,content`, { headers: JH, timeout: 9000 });
  const p = Array.isArray(json) && json[0];
  if (!p) return null;
  const t = norm(decodeHtml((p.title && p.title.rendered) || ""));
  return names.some((n) => t.indexOf(norm(n)) !== -1) ? p : null;
}

/**
 * Bu CDN HER parçayı (8-12 sn) 301 ile başka bir depolama sunucusuna yönlendiriyor (+1 bağlantı/parça).
 * İlk parçanın yönlendirme hedefini 1 istekle öğrenip listeyi doğrudan oradan veririz
 * (depolama sunucusu aynı yoldaki gomindex.m3u8'i de veriyor — test edildi).
 * Android: redirect "manual" -> 301 + Location. iPhone: yönlendirme izlenir -> son URL (r.url).
 */
async function directStorage(listUrl, headers) {
  try {
    const segUrl = listUrl.replace(/[?#].*$/, "").replace(/[^/]*$/, "") + "gomplayer-1.jpeg";
    const r = await withTimeoutP(
      fetch(segUrl, { method: "GET", redirect: "manual", headers: Object.assign({ Range: "bytes=0-0" }, headers) }),
      5000
    );
    if (!r) return listUrl;
    const loc = (r.headers && r.headers.get && r.headers.get("location")) || (r.url && r.url !== segUrl ? r.url : "");
    const hostOf = (x) => (String(x).match(/^(https?:\/\/[^/?#]+)/i) || [])[1] || "";
    const pathOf = (x) => String(x).replace(/^https?:\/\/[^/?#]+/i, "").replace(/[?#].*$/, "");
    const toHost = hostOf(loc);
    if (!toHost || toHost === hostOf(segUrl) || pathOf(loc) !== pathOf(segUrl)) return listUrl;
    return toHost + listUrl.replace(/^https?:\/\/[^/?#]+/i, "");
  } catch (e) {
    return listUrl;
  }
}

function withTimeoutP(p, ms) {
  return Promise.race([p.catch(() => null), new Promise((res) => setTimeout(() => res(null), ms))]);
}

export async function getDiziBakStreams(tmdbId, mediaType, season, episode, diag) {
  const info = await trInfo(tmdbId, mediaType);
  if (!info.isTv) return [];
  const s = parseInt(season, 10) || 1;
  const e = parseInt(episode, 10) || 1;

  // HIZ (v1.0.10): Nuvio eklenti isteklerini telefonda TEK TEK yapıyor (her istek 1-3 sn).
  // Önce bölüm adresini doğrudan tahmin et (dizi-adi-S-sezon-E-bolum): tutarsa arama adımı atlanır.
  let post = await guessEpisode(info, s, e);
  if (post) diag && diag.step(`bölüm ✓ (doğrudan)`);
  else {
    const show = await findShow(info, diag);
    if (!show || !show.slug) return [];
    diag && diag.step(`dizi ✓ ${show.title}`);
    post = await findEpisode(show, s, e, slugify(info.titleEn || info.titleOrig || ""));
  }
  if (!post) {
    diag && diag.fail(`S${s}E${e} sitede yok`);
    return [];
  }
  const html = String((post.content && post.content.rendered) || "");
  const ifr = (html.match(/<iframe[^>]+src=["']([^"']+)["']/i) || [])[1];
  if (!ifr) {
    diag && diag.fail("bölümde oynatıcı yok");
    return [];
  }
  let embed = absUrl(ifr.replace(/\\\//g, "/"), BASE);
  if (/dizibak\.net/.test(embed)) embed = embed.replace(/^https?:\/\/[^/]+/, PLAYER);
  const epUrl = post.link || BASE + "/";

  const pr = await req(embed, { headers: { "User-Agent": UA, Referer: epUrl }, timeout: 9000 });
  const js = (unpack(pr.text) || "") + "\n" + pr.text;
  const files = [];
  const fre = /file["']?\s*:\s*["']([^"']+)["']/g;
  let f;
  while ((f = fre.exec(js))) {
    const u = f[1].replace(/\\+\//g, "/");
    if (/\.m3u8|\.mp4/i.test(u) && files.indexOf(u) === -1) files.push(absUrl(u, PLAYER));
  }
  if (!files.length) {
    diag && diag.fail(`oynatıcıda video yok (${pr.status})`);
    return [];
  }

  const headers = { "User-Agent": UA, Referer: PLAYER + "/", Origin: PLAYER, Accept: "*/*" };
  const out = [];
  for (let u of files.slice(0, 2)) {
    // Kalite dosya adında (".../<id>-720.mp4/gomindex.m3u8"); liste ayrıca indirilmez (1 istek kazanç)
    const qm = u.match(/-(\d{3,4})p?\.mp4\//i); // dosya adındaki hash rakamlarına takılmasın
    const quality = qm ? qualityFromText(qm[1] + "p", "720p") : "720p";
    if (/\/gomindex\.m3u8($|\?)/i.test(u)) u = await directStorage(u, headers);
    out.push({
      url: u,
      quality,
      type: "direct",
      source: "dizibak",
      tr: "altyazi",
      host: "DiziBak",
      format: /\.mp4($|\?)/i.test(u) ? "MP4" : "HLS",
      headers,
    });
  }
  if (out.length) diag && diag.step(`${out.length} link (${out.map((x) => x.quality).join(", ")})`);
  return out;
}
