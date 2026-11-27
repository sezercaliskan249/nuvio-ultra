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

import { trInfo, req, reqJson, norm, absUrl, whyFailed, qualityFromText, decodeHtml } from "../tr/common.js";
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

async function findEpisode(show, s, e) {
  const F = "&_fields=id,title,link,content";
  const { json } = await reqJson(`${API}/posts?slug=${encodeURIComponent(`${show.slug}-${s}-sezon-${e}-bolum`)}${F}`, { headers: JH, timeout: 9000 });
  if (Array.isArray(json) && json[0]) return json[0];
  // Yedek: "final" vb. farklı adresler -> dizinin kategorisinde ara, başlıktan doğrula
  const { json: j2 } = await reqJson(`${API}/posts?categories=${show.id}&per_page=20&search=${encodeURIComponent(`${s}. Sezon ${e}. Bölüm`)}${F}`, { headers: JH, timeout: 9000 });
  const re = new RegExp(`(^|\\D)${s}\\. Sezon ${e}\\. B`, "i");
  return (Array.isArray(j2) && j2.find((p) => p && p.title && re.test(decodeHtml(p.title.rendered || "")))) || null;
}

/** İlk parçanın 301 hedef sunucusu aynı listeyi veriyorsa, liste URL'sini oraya taşır. */
async function directStorage(listUrl, text, headers) {
  try {
    const first = String(text || "").split("\n").map((l) => l.trim()).find((l) => l && l[0] !== "#");
    if (!first || /#EXT-X-STREAM-INF/.test(text)) return listUrl;
    const segUrl = /^https?:\/\//i.test(first) ? first : listUrl.replace(/[?#].*$/, "").replace(/[^/]*$/, "") + first;
    const r = await withTimeoutP(
      fetch(segUrl, { method: "GET", redirect: "manual", headers: Object.assign({ Range: "bytes=0-0" }, headers) }),
      4000
    );
    if (!r) return listUrl;
    const loc = (r.headers && r.headers.get && r.headers.get("location")) || (r.url && r.url !== segUrl ? r.url : "");
    const hostOf = (x) => (String(x).match(/^(https?:\/\/[^/?#]+)/i) || [])[1] || "";
    const pathOf = (x) => String(x).replace(/^https?:\/\/[^/?#]+/i, "").replace(/[?#].*$/, "");
    const toHost = hostOf(loc);
    if (!toHost || toHost === hostOf(segUrl) || pathOf(loc) !== pathOf(segUrl)) return listUrl;
    const moved = toHost + listUrl.replace(/^https?:\/\/[^/?#]+/i, "");
    const chk = await req(moved, { headers, timeout: 4000 });
    return chk.ok && /#EXTM3U/.test(chk.text) ? moved : listUrl;
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

  const show = await findShow(info, diag);
  if (!show || !show.slug) return [];
  diag && diag.step(`dizi ✓ ${show.title}`);

  const post = await findEpisode(show, s, e);
  if (!post) {
    diag && diag.fail(`dizi ✓ ama S${s}E${e} yok`);
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
    // Kalite: master listesindeki en yüksek çözünürlük (aynı zamanda oynatılabilirlik kontrolü)
    let quality = qualityFromText(u, "720p");
    if (/\.m3u8/i.test(u)) {
      const mr = await req(u, { headers, timeout: 8000 });
      if (!mr.ok || !/#EXTM3U/.test(mr.text)) {
        diag && diag.fail(`video listesi açılmadı (${mr.status})`);
        continue;
      }
      const hs = (mr.text.match(/RESOLUTION=\d+x(\d+)/g) || []).map((x) => parseInt(x.split("x")[1], 10));
      if (hs.length) quality = qualityFromText(Math.max.apply(null, hs) + "p", quality);
      // HIZ: bu sunucu HER parçayı (8-12 sn'lik) 301 ile başka bir depolama sunucusuna yönlendiriyor
      // (+0.4 sn/parça, açılış ve sarma yavaşlıyor). Listeyi doğrudan depolama sunucusundan verirsek
      // parçalar yönlendirmesiz gelir.
      u = await directStorage(u, mr.text, headers);
    }
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
