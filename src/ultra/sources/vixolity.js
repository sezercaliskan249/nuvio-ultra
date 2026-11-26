/**
 * Vixolity — Türkçe dublaj + Türkçe altyazılı film VE dizi (1080p HLS)
 *
 * Captcha / Cloudflare yok, tek istek (IMDb ID ile doğrudan adres):
 *   film :  https://ha.vixolity.com/vs/<imdb>
 *   dizi :  https://ha.vixolity.com/vs/<imdb>/s<S>/e<EE>      (bölüm 2 haneli: e01)
 *
 * Cevap bir HLS master listesi:
 *   - #EXT-X-MEDIA TYPE=AUDIO     -> "Türkçe" + orijinal ses (çoğu popüler dizi/film)
 *   - #EXT-X-MEDIA TYPE=SUBTITLES -> en / tr / "st" (Sesotho etiketli ama içerik TÜRKÇE)
 *   - 1080p + 480p video
 * Altyazılar listenin İÇİNDE (gömülü) -> oynatıcının altyazı menüsünden seçilir.
 *
 * ÖNEMLİ: Liste, alt listeler ve video parçaları (.gif/.jpg kılığında TS) bu başlıklar
 * olmadan 403 verir. Android'de ExoPlayer kendi Chrome UA'sını göndermesin diye
 * başlıklar akışa açıkça eklenir.
 */

import { trInfo, req } from "../tr/common.js";

const BASE = "https://ha.vixolity.com";
export const VIXOLITY_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Referer: "https://pl.vixolity.com/",
  Origin: "https://pl.vixolity.com",
  Accept: "*/*",
};

function attr(line, name) {
  const m = line.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : "";
}

function parseMaster(text) {
  const audios = [];
  const subs = [];
  let maxH = 0;
  text.split(/\r?\n/).forEach((l) => {
    if (/^#EXT-X-MEDIA:/.test(l)) {
      const type = (l.match(/TYPE=([A-Z]+)/) || [])[1];
      const item = { lang: attr(l, "LANGUAGE").toLowerCase(), name: attr(l, "NAME") };
      if (type === "AUDIO") audios.push(item);
      else if (type === "SUBTITLES") subs.push(item);
    } else if (/^#EXT-X-STREAM-INF:/.test(l)) {
      const m = l.match(/RESOLUTION=(\d+)x(\d+)/);
      // 1920x800 gibi sinema oranlarında genişliğe bak
      if (m) maxH = Math.max(maxH, parseInt(m[2], 10), Math.round((parseInt(m[1], 10) * 9) / 16));
    }
  });
  return { audios, subs, maxH };
}

function qualityOf(h) {
  if (h >= 2000) return "4K";
  if (h >= 1000) return "1080p";
  if (h >= 700) return "720p";
  if (h >= 470) return "480p";
  return h ? "360p" : "1080p";
}

const isTr = (x) => x.lang === "tr" || x.lang === "tur" || /t[üu]rk/i.test(x.name);

export async function getVixolityStreams(tmdbId, mediaType, season, episode, diag) {
  const info = await trInfo(tmdbId, mediaType);
  if (!info.imdbId) {
    diag && diag.fail("TMDB'de IMDb numarası yok");
    return [];
  }
  const s = parseInt(season, 10) || 1;
  const e = parseInt(episode, 10) || 1;
  const url = info.isTv ? `${BASE}/vs/${info.imdbId}/s${s}/e${e < 10 ? "0" + e : e}` : `${BASE}/vs/${info.imdbId}`;

  const r = await req(url, { headers: VIXOLITY_HEADERS, timeout: 10000 });
  if (r.status === 404) {
    diag && diag.fail(`arşivde yok (${info.imdbId}${info.isTv ? ` S${s}E${e}` : ""})`);
    return [];
  }
  if (!r.ok || !/#EXTM3U/.test(r.text)) {
    diag && diag.fail(`liste açılmadı (${r.status || (r.timeout ? "zaman aşımı" : "bağlantı yok")})`);
    return [];
  }

  const { audios, subs, maxH } = parseMaster(r.text);
  const trAudio = audios.some(isTr);
  const trSub = subs.some(isTr);
  const stSub = subs.some((x) => x.lang === "st"); // "Sesotho" etiketli Türkçe altyazı
  const hasTrSub = trSub || stSub;
  const quality = qualityOf(maxH);
  if (!trAudio && !hasTrSub) {
    diag && diag.fail(`var ama Türkçe ses/altyazı yok (${subs.map((x) => x.lang).join("+") || "altyazısız"})`);
    return [];
  }

  const orig = audios.filter((a) => !isTr(a)).map((a) => a.name || a.lang)[0];
  const audioNote = trAudio ? `Türkçe Dublaj${orig ? " + " + orig : ""}` : "";
  let subNote = "";
  if (hasTrSub) {
    subNote = "💬 TR altyazı gömülü (oynatıcının altyazı menüsünden seç)";
    if (stSub && !trSub) subNote = "💬 TR altyazı gömülü · menüde \"Sesotho\" görünür, o Türkçe";
  }

  diag &&
    diag.step(
      `1 link (${quality}${audios.length ? ", ses: " + audios.map((a) => a.lang || "?").join("+") : ""}${subs.length ? ", altyazı: " + subs.map((x) => x.lang).join("+") : ""})`
    );

  return [
    {
      url,
      quality,
      type: "direct",
      source: "vixolity",
      tr: trAudio ? (hasTrSub ? "ikili" : "dublaj") : "altyazi",
      audioNote,
      subNote,
      host: "Vixolity",
      format: "HLS",
      headers: Object.assign({}, VIXOLITY_HEADERS),
    },
  ];
}
