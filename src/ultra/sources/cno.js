/**
 * CNO (cno.to) — 4K / 1080p HLS, tek istek
 * VyseTV'nin açık kaynak kodundan (film_sources/scrapers.dart, GPL-3.0) uyarlandı.
 *
 *   film :  https://cno.to/api/s/21/movie/<tmdb>?v=3
 *   dizi :  https://cno.to/api/s/21/tv/<tmdb>/<S>/<E>
 *
 * Cevap doğrudan bir HLS master listesi (mutlak adresli 4K/1080p/720p/480p, ses videonun içinde).
 * VyseTV 50 sunucuyu birden soruyor ama testlerde (7 film/dizi) sadece 21 cevap verdi -> tek istek.
 *
 * ÖNEMLİ: API ve video sunucusu (lumenbox.top / prismdesk.top) curl / Lavf / okhttp kimliklerini ve
 * tarayıcı olmayan istemciden gelen tarayıcı kimliklerini Cloudflare ile engelliyor (403). Android'in oynatıcısı OkHttp tabanlı -> kimlik akışa AÇIKÇA
 * yazılır. VLC kimliği tüm testlerde kabul edildi. Parçalar .gif/.webp kılığında (mpv ve ExoPlayer açıyor).
 */

import { req } from "../tr/common.js";
import { parseMaster, qualityOfVariant, videoTags, mbpsOf, resLabel } from "../hlsinfo.js";

const BASE = "https://cno.to";
const SERVER = 21;
// Cloudflare, tarayıcı kimliğini (Chrome/Safari) tarayıcı olmayan TLS ile görünce 403 veriyor (Node, Python,
// OkHttp, iOS URLSession hepsi). Oynatıcı kimlikleri (VLC/ExoPlayer/AppleCoreMedia/libmpv) her istemcide geçiyor.
const PLAYER_UA = "VLC/3.0.20 LibVLC/3.0.20";
const API_HEADERS = {
  "User-Agent": PLAYER_UA,
  Accept: "application/json, text/plain, */*",
  Referer: BASE + "/",
  Origin: BASE,
};
export const CNO_PLAY_HEADERS = { "User-Agent": PLAYER_UA };

// Kart verilecek kaliteler (her biri ayrı kart: düşük hatta 1080p seçilebilsin)
const WANT = ["4K", "1080p"];

export async function getCnoStreams(tmdbId, mediaType, season, episode, diag) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const s = parseInt(season, 10) || 1;
  const e = parseInt(episode, 10) || 1;
  const url = isTv ? `${BASE}/api/s/${SERVER}/tv/${tmdbId}/${s}/${e}` : `${BASE}/api/s/${SERVER}/movie/${tmdbId}?v=3`;

  const r = await req(url, { headers: API_HEADERS, timeout: 9000 });
  if (!r.ok || !/#EXTM3U/.test(r.text)) {
    let why = r.timeout ? "zaman aşımı" : r.status ? `HTTP ${r.status}` : "bağlantı yok";
    if (/not (found|on this server)/i.test(r.text)) why = "bu içerik sunucuda yok";
    diag && diag.fail(`liste gelmedi (${why})`);
    return [];
  }

  const { variants } = parseMaster(r.text, url);
  const out = [];
  const used = {};
  variants.forEach((v) => {
    const q = qualityOfVariant(v);
    if (!v.url || WANT.indexOf(q) === -1 || used[q]) return;
    used[q] = true;
    const mb = mbpsOf(v);
    out.push({
      url: v.url,
      quality: q,
      type: "direct",
      source: "cno",
      server: String(SERVER),
      format: "HLS",
      extraTags: videoTags(v),
      mbps: mb || undefined,
      note: `✅ Doğrulandı: ${resLabel(v)}`,
      headers: Object.assign({}, CNO_PLAY_HEADERS),
    });
  });

  if (!out.length) {
    diag && diag.fail(`liste var ama 4K/1080p yok (${variants.map((v) => v.h + "p").join(", ") || "boş"})`);
    return [];
  }
  diag && diag.step(`${out.map((x) => x.quality).join(" + ")} (tek istek)`);
  return out;
}
