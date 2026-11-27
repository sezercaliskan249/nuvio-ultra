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
// Telefonda istekler tek tek gidiyor: her ek çeviri +2 istek. 2 çeviri = hız/seçenek dengesi.
const MAX_PLAYERS = 2;

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
    // TMDB "Animation" türü (16) — anime olmayan dizilerde siteye hiç gitmeyiz
    animated: (json.genres || []).some((g) => g && g.id === 16),
  };
}

async function findSlug(show, diag) {
  const wanted = show.names.map(norm);
  const tried = [];
  // En fazla 2 isimle ara (her arama telefonda ayrı bir bekleme)
  for (const q of show.names.filter((n) => /[a-z]/i.test(n)).slice(0, 2)) {
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
  return { url: /^\//.test(src) ? PLAYER + src : src, statusText: r.statusText };
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

/**
 * Nuvio'nun eklenti fetch'i iPhone'da Ktor/Darwin (statusText her zaman "OK"), Android'de OkHttp
 * (HTTP/2 cevaplarında statusText BOŞ). anizmplayer.com Cloudflare arkasında = HTTP/2.
 * -> "OK" gelirse iPhone (mpv oynatıcı), boş gelirse Android (ExoPlayer).
 */
function isIosFetch(r) {
  return !!r && r.statusText === "OK";
}

/**
 * iPhone HIZ (v1.0.10): master 4 kalite + ayrı ses içeriyor; mpv oynatmadan önce HEPSİNİ açıp
 * yokluyor (≈16 bağlantı; telefonda bağlantı başına 2-3 sn -> 45-50 sn bekleme).
 * mpv'nin EDL biçimiyle yalnızca en iyi kalite + ses açılır (≈6 bağlantı). Test (2 sn/bağlantı
 * gecikme benzetimi): 31 sn -> 19 sn. EDL sadece mpv'de var -> yalnızca iPhone'a verilir.
 */
function fastEdl(masterUrl, text) {
  const lines = String(text || "").split(/\r?\n/);
  const origin = (masterUrl.match(/^https?:\/\/[^/]+/i) || [""])[0];
  const dir = masterUrl.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  const abs = (u) => (/^https?:\/\//i.test(u) ? u : u[0] === "/" ? origin + u : dir + u);
  let audio = null;
  for (const l of lines) {
    if (!/^#EXT-X-MEDIA:/.test(l) || !/TYPE=AUDIO/.test(l)) continue;
    const m = l.match(/URI="([^"]+)"/);
    if (!m) continue;
    if (!audio || /DEFAULT=YES/.test(l)) audio = abs(m[1]);
  }
  let best = null;
  let bestH = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!/^#EXT-X-STREAM-INF/.test(lines[i])) continue;
    const h = parseInt((lines[i].match(/RESOLUTION=\d+x(\d+)/) || [])[1] || "0", 10);
    let j = i + 1;
    while (j < lines.length && (!lines[j].trim() || lines[j][0] === "#")) j++;
    if (j < lines.length && h > bestH) {
      bestH = h;
      best = abs(lines[j].trim());
    }
  }
  if (!best || !audio || /[;%\s]/.test(best + audio)) return null;
  const part = (u) => `%${u.length}%${u}`;
  return `edl://!no_clip;${part(best)};!new_stream;!no_clip;${part(audio)}`;
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
  if (!show.animated) {
    diag && diag.fail("animasyon/anime değil (TMDB türü) — atlandı");
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
      const ap = await anizmPlayer(h);
      if (!ap) return null;
      const master = playableMaster(ap.url);
      const mr = await req(master, { headers, timeout: 8000 });
      if (!mr.ok || !/#EXTM3U/.test(mr.text)) return null;
      return { master, text: mr.text, ios: isIosFetch(ap) || isIosFetch(mr) };
    })
  );
  let n = 0;
  let fallback = null;
  for (const it of masters) {
    if (!it) continue;
    // Kalite: master listesindeki en yüksek çözünürlük
    const hs = (it.text.match(/RESOLUTION=\d+x(\d+)/g) || []).map((x) => parseInt(x.split("x")[1], 10));
    const max = hs.length ? Math.max.apply(null, hs) : 0;
    const quality = max >= 1000 ? "1080p" : max >= 700 ? "720p" : max ? "480p" : "1080p";
    const tag = hashes.length > 1 ? `🎌 Çeviri ${n + 1} · ` : "";
    n++;
    const auto = hs.length > 1 ? "Otomatik kalite (" + hs.slice().sort((a, b) => b - a).map((x) => x + "p").join("/") + ")" : "HLS";
    const base = { quality, type: "direct", source: "diziwatch", tr: "altyazi", host: "AnizmPlayer", format: "HLS", headers };
    const edl = it.ios ? fastEdl(it.master, it.text) : null;
    if (edl) {
      out.push(Object.assign({}, base, { url: edl, note: `${tag}⚡ Hızlı açılış (iPhone): tek kalite ${quality} + ses` }));
      if (!fallback) fallback = Object.assign({}, base, { url: it.master, note: `${tag}↩️ Yedek: hızlı mod açılmazsa bunu dene (yavaş açılır) · ${auto}` });
    } else {
      out.push(Object.assign({}, base, { url: it.master, note: tag ? tag + auto : "" }));
    }
  }
  if (fallback) out.push(fallback);

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
