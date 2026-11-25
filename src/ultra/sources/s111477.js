/**
 * 111477 (a.111477.xyz) — 1.4 PB'lık açık arşiv: filmler + diziler, çoğu 4K / REMUX
 *
 * Dosyaları doğrudan açmak Cloudflare doğrulamasına takılıyor (p.111477.xyz/bulk).
 * Arşivin KENDİ Stremio eklentisi (st.111477.xyz) ise "worker" linkleri üretiyor; VyseTV
 * de bunu kullanıyor. Kurallar (st.111477.xyz/slowdown):
 *   - Datacenter / VPN IP'leri yasaklı  -> telefonda VPN kapalı olmalı
 *   - IP başına 10 jeton, her istek 1 jeton, 5 dakikada 1 jeton dolar
 */

import { req } from "../tr/common.js";
import { getMediaInfo } from "../tmdb.js";
import { b64urlEncode } from "../lib/b64.js";

const ORIGIN = "https://st.111477.xyz";
const TMDB_KEY = "68e094699525b18a70bab2f86b1fa706";
// Küçükten büyüğe: 100 Mbps hatta akabilecek sürümler önce gelsin (REMUX'lar da listede kalır)
const CONFIG =
  "https://a.111477.xyz/::sort=file-asc::limit=6::tmdb=" +
  TMDB_KEY +
  "::title=" +
  encodeURIComponent("{filename}|{size}|{resolution}|{server}");
const BASE = `${ORIGIN}/config/${b64urlEncode(CONFIG)}`;

function parseSize(t) {
  const m = String(t || "").match(/([\d.]+)\s*(TB|GB|MB|GiB|MiB|TiB)/i);
  if (!m) return 0;
  const u = m[2].toUpperCase()[0];
  return parseFloat(m[1]) * (u === "T" ? 1e12 : u === "G" ? 1e9 : 1e6);
}

function fmtSize(b) {
  if (!b) return "";
  return b >= 1e9 ? (b / 1e9).toFixed(2) + " GB" : Math.round(b / 1e6) + " MB";
}

function qualityOf(t) {
  const s = String(t || "");
  if (/2160|4k|uhd/i.test(s)) return "4K";
  if (/1440/.test(s)) return "1440p";
  if (/1080/.test(s)) return "1080p";
  if (/720/.test(s)) return "720p";
  if (/576|480/.test(s)) return "480p";
  return "1080p";
}

export async function get111477Streams(tmdbId, mediaType, season, episode, diag) {
  const info = await getMediaInfo(tmdbId, mediaType);
  const isTv = info.isTv;
  const targets = [];
  if (info.imdbId) targets.push(info.imdbId);
  targets.push(`tmdb:${tmdbId}`);

  for (const target of targets) {
    const url = isTv
      ? `${BASE}/stream/series/${target}:${season || 1}:${episode || 1}.json`
      : `${BASE}/stream/movie/${target}.json`;
    const r = await req(url, { headers: { Accept: "application/json" }, timeout: 15000 });
    if (!r.ok) {
      diag && diag.fail(`eklenti cevap vermedi (${r.status || (r.timeout ? "zaman aşımı" : "bağlantı yok")})`);
      continue;
    }
    let json = null;
    try {
      json = JSON.parse(r.text);
    } catch (e) {}
    const items = (json && json.streams) || [];

    // Engel / kota mesajları da "stream" olarak geliyor
    const blocked = items.find((x) => /slowdown|spammy|slow down/i.test((x.url || "") + " " + (x.title || "") + " " + (x.name || "")));
    if (blocked) {
      const t = (blocked.title || blocked.name || "").replace(/\s+/g, " ");
      diag &&
        diag.fail(
          /spammy|banned/i.test(t)
            ? "IP engelli (VPN / datacenter). VPN'i kapatıp tekrar dene"
            : "jeton bitti (5 dakikada 1 dolar), biraz bekle"
        );
      return [];
    }

    const out = [];
    items.forEach((x) => {
      if (!x || !/^https?:/.test(x.url || "")) return;
      const lines = String(x.title || x.description || "").split("\n").map((l) => l.trim());
      const bh = x.behaviorHints || {};
      const fileName = bh.filename || lines[0] || "";
      const bytes = bh.videoSize || parseSize(lines[1] || x.title);
      const res = lines[2] || "";
      const headers = bh.proxyHeaders && bh.proxyHeaders.request;
      out.push({
        url: x.url,
        quality: qualityOf(res + " " + fileName),
        type: "direct",
        source: "111477",
        kind: "A111",
        server: lines[3] || "",
        size: fmtSize(bytes),
        bytes,
        fileName,
        headers: headers && Object.keys(headers).length ? headers : undefined,
      });
    });
    if (out.length) {
      diag && diag.step(`${out.length} dosya (${target})`);
      return out;
    }
  }
  diag && diag.fail("arşivde bu başlık yok");
  return [];
}
