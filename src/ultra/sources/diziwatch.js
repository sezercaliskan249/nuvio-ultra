/**
 * DiziWatch — Türkçe altyazılı anime (AnizmPlayer, 1080p / 720p / 480p HLS)
 *
 * diziwatch.org bir anime sitesi; Cloudflare / captcha yok. Videolar Anizm'in kendi
 * oynatıcısı AnizmPlayer'da (fansub çevirisi, Türkçe altyazı videoya gömülü).
 * (anizm.net'in kendisi Cloudflare arkasında; aynı videolara DiziWatch üzerinden ulaşıyoruz.)
 *
 * Akış:
 *   1. TMDB -> İngilizce/orijinal isim, yıl, poster
 *   2. diziwatch.org/api/ara?q=<isim>  -> [{slug, title, year, poster}]
 *      (poster TMDB'den geliyor -> poster aynıysa kesin eşleşme, değilse isim + yıl)
 *   3. /dizi/<slug>/sezon-S/bolum-E   (sezonlar TMDB ile aynı)
 *      One Piece gibi tek sezonda listelenen uzun serilerde: TMDB sezonlarından
 *      mutlak bölüm numarası hesaplanır -> /sezon-1/bolum-<mutlak>
 *   4. Sayfadaki anizmplayer.com/video/<hash>  ->  POST /player/index.php?data=<hash>&do=getVideo
 *      -> { videoSource: ".../master.txt" }  (HLS master; oynatıcıya ".../master.txt.m3u8" verilir)
 *   Yedek: Sibnet (MP4) — AnizmPlayer yoksa.
 */

import { req, reqJson, norm, yearOk, whyFailed } from "../tr/common.js";
import { extractEmbed } from "../tr/extractors.js";

const BASE = "https://diziwatch.org";
const PLAYER = "https://anizmplayer.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
const MAX_PLAYERS = 3;

async function tmdbShow(tmdbId) {
  const { json } = await reqJson(
    `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${TMDB_API_KEY}&language=en-US&append_to_response=alternative_titles`,
    { timeout: 8000 }
  );
  if (!json || !json.id) return null;
  const alts = ((json.alternative_titles && json.alternative_titles.results) || [])
    .filter((a) => /US|JP|GB|TR|^$/.test(a.iso_3166_1 || ""))
    .map((a) => a.title);
  return {
    names: [json.name, json.original_name].concat(alts).filter((t, i, a) => t && a.indexOf(t) === i),
    year: parseInt(String(json.first_air_date || "").slice(0, 4), 10) || 0,
    poster: String(json.poster_path || "").replace(/^\//, ""),
    seasons: (json.seasons || []).filter((x) => x.season_number > 0).map((x) => ({ n: x.season_number, count: x.episode_count || 0 })),
  };
}

async function findSlug(show, diag) {
  const wanted = show.names.map(norm);
  const tried = [];
  // En fazla 4 isimle ara (İngilizce, orijinal, alternatifler)
  for (const q of show.names.filter((n) => /[a-z]/i.test(n)).slice(0, 4)) {
    tried.push(q);
    const { r, json } = await reqJson(`${BASE}/api/ara?q=${encodeURIComponent(q)}`, {
      headers: { "User-Agent": UA, Accept: "application/json", Referer: BASE + "/" },
      timeout: 8000,
    });
    if (!Array.isArray(json)) {
      if (r && !r.ok) {
        diag && diag.fail(`arama açılmadı (${whyFailed(r)})`);
        return null;
      }
      continue;
    }
    const byPoster = show.poster && json.find((x) => x && x.slug && String(x.poster || "").indexOf(show.poster) !== -1);
    if (byPoster) return byPoster.slug;
    const byName = json.find((x) => x && x.slug && wanted.indexOf(norm(x.title)) !== -1 && yearOk(x.year, show.year));
    if (byName) return byName.slug;
  }
  diag && diag.fail(`anime bulunamadı (${tried[0] || "?"})`);
  return null;
}

async function episodePage(slug, s, e) {
  const r = await req(`${BASE}/dizi/${slug}/sezon-${s}/bolum-${e}`, { headers: { "User-Agent": UA, Referer: BASE + "/" }, timeout: 9000 });
  return r.ok && /anizmplayer|sibnet|"sources"/.test(r.text) ? r.text : null;
}

async function anizmPlayer(hash) {
  const r = await req(`${PLAYER}/player/index.php?data=${hash}&do=getVideo`, {
    headers: { "User-Agent": UA, Referer: `${PLAYER}/video/${hash}`, Origin: PLAYER, "X-Requested-With": "XMLHttpRequest", Accept: "application/json, */*" },
    form: { hash, r: BASE + "/" },
    timeout: 9000,
  });
  let d = null;
  try {
    d = JSON.parse(r.text);
  } catch (e) {
    return null;
  }
  const src = d && (d.videoSource || d.securedLink);
  if (!src) return null;
  return /^\//.test(src) ? PLAYER + src : src;
}

/**
 * ÖNEMLİ (v1.0.9): ".../master.txt" adresini iPhone'daki oynatıcı (mpv/ffmpeg) HLS olarak TANIMIYOR
 * ("Not detecting m3u8/hls with non standard extension") ve "başlatılıyor"da kalıyordu; "#.m3u8"
 * eki işe yaramıyor (sunucuya gitmeyen kısım sayılmıyor). Sunucu aynı listeyi ".../master.txt.m3u8"
 * adresinden "application/x-mpegURL" türüyle de veriyor -> mpv ve ExoPlayer ikisi de oynatıyor (test edildi).
 */
function playableMaster(src) {
  const clean = String(src).replace(/#.*$/, "");
  if (/\.m3u8($|\?)/i.test(clean)) return clean;
  return clean.replace(/(\.txt)($|\?)/i, "$1.m3u8$2");
}

export async function getDiziWatchStreams(tmdbId, mediaType, season, episode, diag) {
  if (!(mediaType === "tv" || mediaType === "series")) {
    diag && diag.fail("sadece anime dizileri (film yok)");
    return [];
  }
  const s = parseInt(season, 10) || 1;
  const e = parseInt(episode, 10) || 1;
  const show = await tmdbShow(tmdbId);
  if (!show) {
    diag && diag.fail("TMDB bilgisi alınamadı");
    return [];
  }
  const slug = await findSlug(show, diag);
  if (!slug) return [];

  let page = await episodePage(slug, s, e);
  let label = `S${s}E${e}`;
  if (!page && s > 1) {
    // Uzun seriler (One Piece vb.) sitede tek sezon: mutlak bölüm numarası
    const abs = show.seasons.filter((x) => x.n < s).reduce((a, x) => a + x.count, 0) + e;
    page = await episodePage(slug, 1, abs);
    if (page) label = `bölüm ${abs} (mutlak)`;
  }
  if (!page) {
    diag && diag.fail(`anime ✓ (${slug}) ama ${label} yok`);
    return [];
  }
  diag && diag.step(`anime ✓ ${slug} ${label}`);

  const flat = page.replace(/\\"/g, '"').replace(/\\\//g, "/");
  const hashes = [];
  const reH = /anizmplayer\.com\/video\/([a-f0-9]{24,40})/gi;
  let m;
  while ((m = reH.exec(flat))) if (hashes.indexOf(m[1]) === -1) hashes.push(m[1]);
  const sibs = [];
  const reS = /https?:\/\/video\.sibnet\.ru\/shell\.php\?videoid=\d+/gi;
  while ((m = reS.exec(flat))) if (sibs.indexOf(m[0]) === -1) sibs.push(m[0]);

  const out = [];
  // Accept başlığı ŞART: yoksa AnizmPlayer liste yerine "security error" döndürüyor
  const headers = { "User-Agent": UA, Referer: PLAYER + "/", Origin: PLAYER, Accept: "*/*" };
  // Tüm çeviriler aynı anda çözülür (sırayla ~1 sn/çeviri yerine)
  const masters = await Promise.all(
    hashes.slice(0, MAX_PLAYERS).map(async (h) => {
      const m0 = await anizmPlayer(h);
      if (!m0) return null;
      const master = playableMaster(m0);
      const mr = await req(master, { headers, timeout: 8000 });
      if (!mr.ok || !/#EXTM3U/.test(mr.text)) return null;
      return { master, text: mr.text };
    })
  );
  let n = 0;
  for (const it of masters) {
    if (!it) continue;
    // Kalite: master listesindeki en yüksek çözünürlük
    const hs = (it.text.match(/RESOLUTION=\d+x(\d+)/g) || []).map((x) => parseInt(x.split("x")[1], 10));
    const max = hs.length ? Math.max.apply(null, hs) : 0;
    n++;
    out.push({
      url: it.master,
      quality: max >= 1000 ? "1080p" : max >= 700 ? "720p" : max ? "480p" : "1080p",
      type: "direct",
      source: "diziwatch",
      tr: "altyazi",
      host: "AnizmPlayer",
      format: "HLS",
      headers,
      note: hashes.length > 1 ? `🎌 Çeviri ${n} · ${hs.length > 1 ? "Otomatik kalite (" + hs.sort((a, b) => b - a).map((x) => x + "p").join("/") + ")" : "HLS"}` : "",
    });
  }

  // Yedek: Sibnet (AnizmPlayer hiç çalışmadıysa)
  if (!out.length) {
    for (const u of sibs.slice(0, 2)) {
      const r = await extractEmbed(u, BASE + "/");
      r.forEach((x) =>
        out.push({
          url: x.url,
          quality: "720p",
          type: "direct",
          source: "diziwatch",
          tr: "altyazi",
          host: "Sibnet",
          format: "MP4",
          headers: Object.assign({ "User-Agent": UA }, x.headers || {}),
          note: "↩️ Yedek sunucu (bu bölümde AnizmPlayer yok)",
        })
      );
      if (out.length) break;
    }
  }

  if (out.length) diag && diag.step(`${out.length} link (${out.map((x) => x.host + " " + x.quality).join(", ")})`);
  else diag && diag.fail(`bölüm ✓ ama oynatıcı çözülemedi (AnizmPlayer ${hashes.length}, Sibnet ${sibs.length})`);
  return out;
}
