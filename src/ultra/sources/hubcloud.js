/**
 * HubCloud çözücü - 4KHDHub ve MoviesDrive ortak kullanır.
 *
 * hubcloud sayfası -> (var url / #download) -> link sayfası -> butonlar:
 *   - "Download File" / r2.dev / workers.dev  => Direct R2  (sarılabilir, en güvenilir)
 *   - "FSL Server" / "FSLv2"                  => FSL        (sarılabilir)
 *   - "10Gbps" / PixelServer                  => Google CDN (çok hızlı, sarma sınırlı)
 *   - "ZipDisk"                               => ZipDisk    (Google Drive tabanlı, kota dolabilir)
 */

import cheerio from "cheerio-without-node-native";
import { safeText, resolveFinalUrl, safeUrl, probeStability, USER_AGENT } from "../http.js";

const HTML_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

// --- küçük yardımcılar ------------------------------------------------------

export function atobSafe(input) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const str = String(input).replace(/=+$/, "");
  let output = "";
  for (
    let bc = 0, bs, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, (c) =>
    String.fromCharCode((c <= "Z" ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
  );
}

export function parseBytes(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const m = String(val).match(/([0-9.]+)\s*([KMGT]?B)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  const mul = u[0] === "T" ? 1099511627776 : u[0] === "G" ? 1073741824 : u[0] === "M" ? 1048576 : u[0] === "K" ? 1024 : 1;
  return n * mul;
}

export function formatBytes(b) {
  if (!b) return "";
  if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
  return Math.round(b / 1048576) + " MB";
}

/**
 * Dosya adından etiketler: REMUX, DV, HDR, HEVC, Atmos, ses dilleri
 */
export function describeRelease(title) {
  const t = String(title || "");
  const tags = [];
  if (/remux/i.test(t)) tags.push("REMUX");
  else if (/blu-?ray/i.test(t)) tags.push("BluRay");
  else if (/web-?dl/i.test(t)) tags.push("WEB-DL");
  else if (/webrip/i.test(t)) tags.push("WEBRip");
  const hdr = [];
  if (/\bDV\b|dolby.?vision/i.test(t)) hdr.push("DV");
  if (/HDR10\+/i.test(t)) hdr.push("HDR10+");
  else if (/HDR/i.test(t)) hdr.push("HDR");
  if (hdr.length) tags.push(hdr.join(" "));
  if (/x265|hevc|h\.?265/i.test(t)) tags.push("HEVC");
  if (/atmos/i.test(t)) tags.push("Atmos");

  const langs = [];
  if (/english|\beng\b/i.test(t)) langs.push("EN");
  if (/hindi/i.test(t)) langs.push("Hindi");
  if (/tamil/i.test(t)) langs.push("Tamil");
  if (/telugu/i.test(t)) langs.push("Telugu");
  return { tags, langs };
}

// --- redirect / sayfa çözme -------------------------------------------------

/**
 * 4KHDHub'ın şifreli yönlendirme linklerini çözer (atob x2 -> rot13 -> atob -> JSON.o)
 */
export async function resolveObfuscatedRedirect(url) {
  if (/hubcloud\.|hubdrive\./i.test(url)) return url;
  const html = await safeText(url, { headers: HTML_HEADERS });
  if (!html) return url;
  try {
    const m = html.match(/'o','(.*?)'/);
    if (!m) return url;
    const data = JSON.parse(atobSafe(rot13(atobSafe(atobSafe(m[1])))));
    if (data && data.o) return atobSafe(data.o);
  } catch (e) {
    // yut
  }
  return url;
}

function classify(text, href) {
  const tx = text.toLowerCase();
  if (/10gbps|pixelserver/i.test(text) || /pixel\.hubcloud|hubcloud\.cx/i.test(href)) return "PIXEL";
  if (tx.indexOf("fsl") !== -1) return "FSL";
  if (tx.indexOf("zipdisk") !== -1) return "ZIPDISK";
  if (tx.indexOf("download file") !== -1 || /r2\.dev/i.test(href)) return "R2";
  if (/workers\.dev/i.test(href)) return "ZIPDISK";
  if (tx.indexOf("s3 server") !== -1) return "S3";
  return null;
}

/**
 * Google CDN (10Gbps) linkini yönlendirmeden çıkarır
 */
async function resolvePixel(url) {
  const final = await resolveFinalUrl(url, { Referer: url });
  if (!final) return null;
  const m = final.match(/[?&]link=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch (e) {
      return m[1];
    }
  }
  if (/googleusercontent\.com|googlevideo\.com/i.test(final)) return final;
  return null;
}

/**
 * HubCloud linkinden oynatılabilir linkleri çıkarır
 * @returns [{ kind: "R2"|"FSL"|"PIXEL"|"ZIPDISK"|"S3", url, bytes, fileTitle }]
 */
export async function extractHubCloud(hubUrl, referer) {
  if (!hubUrl) return [];
  let pageUrl = hubUrl.replace("hubcloud.ink", "hubcloud.dad");
  let html = await safeText(pageUrl, { headers: { ...HTML_HEADERS, Referer: referer || pageUrl } });
  if (!html) return [];

  if (pageUrl.indexOf("hubcloud.php") === -1) {
    let next = "";
    const $first = cheerio.load(html);
    const btn = $first("#download").attr("href");
    if (btn) next = btn;
    else {
      const m = html.match(/var url ?= ?'(.*?)'/);
      if (m) next = m[1];
    }
    if (next) {
      if (!/^https?:/i.test(next)) {
        const host = pageUrl.match(/^(https?:\/\/[^/]+)/);
        next = (host ? host[1] : "") + "/" + next.replace(/^\//, "");
      }
      const html2 = await safeText(next, { headers: { ...HTML_HEADERS, Referer: pageUrl } });
      if (html2) {
        html = html2;
        pageUrl = next;
      }
    }
  }

  const $ = cheerio.load(html);
  const bytes = parseBytes($("#size").text() || $("i#size").text());
  const fileTitle = ($("div.card-header").text() || $("title").text() || "").trim();

  const raw = [];
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || !/^https?:/i.test(href)) return;
    const kind = classify($(el).text().trim(), href);
    if (kind) raw.push({ kind, url: href });
  });

  // PIXEL linklerini Google CDN'e çöz (paralel)
  const resolved = await Promise.all(
    raw.map((r) => {
      if (r.kind !== "PIXEL") return Promise.resolve({ ...r, url: safeUrl(r.url) });
      return resolvePixel(r.url).then((g) => (g ? { ...r, url: g } : null));
    })
  );

  const seen = {};
  const unique = resolved.filter((r) => r && r.url && !seen[r.url] && (seen[r.url] = true));

  // Tüm linkleri 1 byte'lık istekle doğrula (ölü / "Generate Link Again" / kota dolu olanlar elenir)
  // Sadece R2 / worker linkleri test edilir (1 byte). Google CDN test EDİLMEZ:
  // Range'i yok sayıyor, Nuvio'da 16 MB indirmeye sebep oluyordu.
  // 3 eşzamanlı istek: kotası dolmuş hesaplara düşen "kararsız" linkler işaretlenir
  const checks = await Promise.all(
    unique.map((r) => (r.kind === "PIXEL" ? Promise.resolve(-1) : probeStability(r.url, 3500, 3)))
  );
  return unique
    .map((r, i) => ({ ...r, bytes, fileTitle, okCount: checks[i], flaky: checks[i] > 0 && checks[i] < 3 }))
    .filter((r) => r.okCount !== 0);
}

/**
 * Link türüne göre kısa açıklama + öncelik
 */
export function kindInfo(kind) {
  switch (kind) {
    case "R2":
      return { label: "⚡ Direkt", prio: 5 };
    case "FSL":
      return { label: "⚡ FSL", prio: 4 };
    case "PIXEL":
      return { label: "🚀 Google CDN (ileri sarma sınırlı)", prio: 2 };
    case "S3":
      return { label: "S3", prio: 3 };
    case "ZIPDISK":
      return { label: "ZipDisk", prio: 1 };
    default:
      return { label: kind, prio: 0 };
  }
}
