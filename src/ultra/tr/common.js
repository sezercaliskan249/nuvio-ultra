/**
 * Türk siteleri için ortak yardımcılar
 *  - TMDB'den Türkçe + orijinal isim, yıl, IMDb
 *  - Site adresi otomatik bulma (adres değişince yönlendirmeyi takip eder)
 *  - Teşhis (diag) kaydı: Nuvio'daki "Test" butonunda neyin bozulduğunu gösterir
 */

import { withTimeout } from "../http.js";

export const UA =
  "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36";

const TMDB_API_KEY = "68e094699525b18a70bab2f86b1fa706";
const infoCache = {};

/** TMDB -> { titleTr, titleOrig, year, imdbId, isTv } */
export function trInfo(tmdbId, mediaType) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const key = (isTv ? "tv:" : "movie:") + tmdbId;
  if (infoCache[key]) return infoCache[key];
  const url =
    `https://api.themoviedb.org/3/${isTv ? "tv" : "movie"}/${tmdbId}` +
    `?api_key=${TMDB_API_KEY}&language=tr-TR&append_to_response=external_ids,translations`;
  const p = fetch(url)
    .then((r) => r.json())
    .then((d) => {
      const date = (isTv ? d.first_air_date : d.release_date) || "";
      return {
        titleTr: (isTv ? d.name : d.title) || "",
        titleOrig: (isTv ? d.original_name : d.original_title) || "",
        // İngilizce isim (sitelerin çoğu dizileri İngilizce adıyla listeliyor)
        titleEn: (() => {
          const t = ((d.translations && d.translations.translations) || []).find((x) => x.iso_639_1 === "en" && x.data && (x.data.name || x.data.title));
          return t ? t.data.name || t.data.title : "";
        })(),
        year: parseInt(date.slice(0, 4), 10) || 0,
        lastYear: parseInt(String(d.last_air_date || "").slice(0, 4), 10) || 0,
        imdbId: (d.external_ids && d.external_ids.imdb_id) || d.imdb_id || null,
        isTv,
      };
    })
    .catch((e) => {
      delete infoCache[key];
      throw e;
    });
  infoCache[key] = p;
  return p;
}

/** "Dune: Çöl Gezegeni" -> "dune-col-gezegeni" */
export function slugify(t) {
  return String(t || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[âàáä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îíï]/g, "i")
    .replace(/[ôóò]/g, "o")
    .replace(/[ûúù]/g, "u")
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Karşılaştırma için sadeleştir */
export function norm(t) {
  return slugify(t).replace(/-/g, "");
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function originOf(url) {
  const m = String(url || "").match(/^(https?:\/\/[^/?#]+)/i);
  return m ? m[1] : "";
}

export function absUrl(u, base) {
  if (!u) return u;
  u = String(u).trim();
  if (/^https?:\/\//i.test(u)) return u;
  if (u.indexOf("//") === 0) return "https:" + u;
  if (u[0] === "/") return originOf(base) + u;
  return originOf(base) + "/" + u;
}

export function decodeHtml(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** "\x68\x74..." veya "6874..." -> metin */
export function hexDecode(s) {
  const clean = String(s || "").replace(/\\x/g, "");
  if (!/^[0-9a-f]+$/i.test(clean) || clean.length % 2) return null;
  let out = "";
  for (let i = 0; i < clean.length; i += 2) out += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  try {
    return decodeURIComponent(escape(out)); // UTF-8
  } catch (e) {
    return out;
  }
}

// ---------------------------------------------------------------------------
// HTTP: hata fırlatmayan, durum kodu + son URL + çerez döndüren istekler
// ---------------------------------------------------------------------------
export async function req(url, opts = {}) {
  const headers = Object.assign({ "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.7" }, opts.headers || {});
  const init = { method: opts.method || "GET", headers };
  if (opts.form) {
    init.method = "POST";
    init.body = Object.keys(opts.form)
      .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(opts.form[k] == null ? "" : opts.form[k]))
      .join("&");
    headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
  }
  try {
    const p = fetch(url, init).then(async (r) => {
      const text = await r.text();
      const get = (n) => (r.headers && r.headers.get ? r.headers.get(n) : null);
      return { ok: r.ok, status: r.status, url: r.url || url, text: text || "", cookie: cookieFrom(get("set-cookie")) };
    });
    const res = await withTimeout(p, opts.timeout || 9000, null);
    return res || { ok: false, status: 0, url, text: "", timeout: true, cookie: "" };
  } catch (e) {
    return { ok: false, status: 0, url, text: "", error: String((e && e.message) || e), cookie: "" };
  }
}

export async function reqJson(url, opts = {}) {
  const r = await req(url, opts);
  try {
    return { r, json: JSON.parse(r.text) };
  } catch (e) {
    return { r, json: null };
  }
}

function cookieFrom(sc) {
  if (!sc) return "";
  // Nuvio birden fazla Set-Cookie'yi virgülle birleştirir (expires içinde de virgül olabilir)
  return String(sc)
    .split(/,(?=\s*[A-Za-z0-9_\-.]+=)/)
    .map((c) => c.trim().split(";")[0])
    .filter((c) => c && c.indexOf("=") > 0)
    .join("; ");
}

/** Bir isteğin neden başarısız olduğunu Türkçe özetle */
export function whyFailed(r) {
  if (!r) return "cevap yok";
  if (r.timeout) return "zaman aşımı";
  if (r.status === 0) return "bağlanamadı" + (r.error ? ` (${r.error.slice(0, 40)})` : "");
  if ((r.status === 403 || r.status === 503) && /cloudflare|cf-ray|attention required|just a moment/i.test(r.text))
    return `Cloudflare engeli (${r.status})`;
  return `HTTP ${r.status}`;
}

// ---------------------------------------------------------------------------
// Site adresi bulma: listedeki adresleri sırayla dener, yönlendirmeyi takip eder
// ---------------------------------------------------------------------------
const baseCache = {};

export function resolveBase(key, candidates, marker, diag) {
  if (baseCache[key]) return baseCache[key];
  const p = (async () => {
    const reasons = [];
    // ÖNEMLİ: Nuvio'da fetch senkron (runBlocking) -> istekler zaten sırayla gider ve
    // süre sınırı uygulanamaz (OkHttp 60 sn). Bu yüzden adresler TEK TEK denenir,
    // ilk çalışan veya Cloudflare ile engellenen adreste durulur.
    for (let i = 0; i < candidates.length; i++) {
      const r = await req(candidates[i] + "/", { timeout: 8000 });
      if (!r.ok && /cloudflare/i.test(whyFailed(r))) {
        reasons.push(`${candidates[i].replace(/^https?:\/\//, "")}: ${whyFailed(r)}`);
        break;
      }
      if (r.ok && marker.test(r.text)) {
        const base = originOf(r.url) || candidates[i];
        if (diag) diag.step(`adres ✓ ${base.replace(/^https?:\/\//, "")}`);
        return { base, cookie: r.cookie };
      }
      reasons.push(`${candidates[i].replace(/^https?:\/\//, "")}: ${r.ok ? "içerik tanınmadı" : whyFailed(r)}`);
    }
    if (diag) diag.fail(`site açılmadı → ${reasons.slice(0, 2).join(" | ")}`);
    delete baseCache[key];
    return null;
  })();
  baseCache[key] = p;
  return p;
}

// ---------------------------------------------------------------------------
// Teşhis kaydı
// ---------------------------------------------------------------------------
export function makeDiag(site) {
  const steps = [];
  return {
    site,
    steps,
    step(msg) {
      steps.push({ ok: true, msg });
      console.log(`[${site}] ${msg}`);
    },
    fail(msg) {
      steps.push({ ok: false, msg });
      console.log(`[${site}] ✗ ${msg}`);
    },
  };
}

/** Yıl uyuşuyor mu (±1 tolerans) */
export function yearOk(found, want) {
  if (!found || !want) return true;
  return Math.abs(found - want) <= 1;
}

/** "1080p", "FullHD", "4K" gibi metinden kalite */
export function qualityFromText(t, fallback) {
  const s = String(t || "");
  if (/2160|4k|uhd/i.test(s)) return "4K";
  if (/1080|full ?hd|fhd/i.test(s)) return "1080p";
  if (/720|\bhd\b/i.test(s)) return "720p";
  if (/480/i.test(s)) return "480p";
  if (/360/i.test(s)) return "360p";
  return fallback || "Auto";
}
