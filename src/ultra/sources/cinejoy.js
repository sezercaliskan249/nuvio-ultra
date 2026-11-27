/**
 * Cinejoy (cinejoy.pk) — 4K HDR10 (HEVC 10bit) + 1080p HLS
 * VyseTV'nin açık kaynak kodundan (film_sources/scrapers.dart, GPL-3.0) uyarlandı.
 *
 * Akış (sunucu başına 3 istek):
 *   1. GET  enc-dec.app/api/enc-cinejoy?url=<api.wing.st/?title=..&server=Light>  -> {data (base64url), state}
 *   2. POST api.wing.st/g   gövde = data'nın BAYT hali (ikili)                     -> ikili cevap
 *   3. POST enc-dec.app/api/dec-cinejoy  {text: base64url(cevap), state}            -> {stream:[{playlist}]}
 *   (+1) master listesi okunur: en yüksek çözünürlük, HEVC/HDR, ses dilleri kartta gösterilir.
 *
 * Sunucular: Light (4K, önce sorulur) -> o boşsa Nebula (1080p).
 *   Lisbon kaldırılmış, Sirius 500 veriyor, Polaris parçaları PNG içine gizlenmiş TS (oynatıcı açamaz).
 *
 * İKİLİ VERİ: Nuvio'nun yeni fetch köprüsü Uint8Array gövdeyi ve response.arrayBuffer()'ı destekliyor.
 * Eski sürümlerde arrayBuffer yoksa kaynak sessizce atlanır (🔍 satırında yazar).
 *
 * Oynatma: master + alt listeler + parçalar `Origin: https://cinejoy.pk` olmadan 404 verir.
 * Light'ta ses ayrı grupta -> master adresi verilir (oynatıcı kaliteyi kendisi seçer).
 *
 * Risk: enc-dec.app üçüncü taraf bir servis; kapanırsa bu kaynak da çalışmaz (diğerleri etkilenmez).
 */

import { trInfo } from "../tr/common.js";
import { withTimeout } from "../http.js";
import { b64decodeBytes, bytesToB64url } from "../lib/b64.js";
import { parseMaster, qualityOfVariant, videoTags, mbpsOf, resLabel, audioNames } from "../hlsinfo.js";

const WING = "https://api.wing.st";
const ENCDEC = "https://enc-dec.app/api";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";
const CJ_HEADERS = { "User-Agent": UA, Referer: "https://cinejoy.pk/", Origin: "https://cinejoy.pk" };
const SERVERS = ["Light", "Nebula"];

function timed(p, ms) {
  return withTimeout(p, ms, null);
}

async function getJson(url, init, ms) {
  const r = await timed(
    fetch(url, init).then(async (res) => ({ status: res.status, text: await res.text() })),
    ms
  );
  if (!r) return { status: 0, json: null };
  try {
    return { status: r.status, json: JSON.parse(r.text) };
  } catch (e) {
    return { status: r.status, json: null };
  }
}

async function askServer(info, tmdbId, isTv, s, e, server) {
  const params = [
    ["title", info.titleEn || info.titleOrig || info.titleTr || "Media"],
    ["type", isTv ? "series" : "movie"],
    ["year", info.year ? String(info.year) : ""],
    ["imdb", info.imdbId || ""],
    ["tmdb", String(tmdbId)],
    ["server", server],
  ];
  if (isTv) params.push(["season", String(s)], ["episode", String(e)]);
  const query = params.map((p) => encodeURIComponent(p[0]) + "=" + encodeURIComponent(p[1]).replace(/%20/g, "+")).join("&");

  // 1) isteği mühürle
  const enc = await getJson(`${ENCDEC}/enc-cinejoy?url=${encodeURIComponent(WING + "/?" + query)}`, { headers: { "User-Agent": UA, Accept: "application/json" } }, 8000);
  const res = enc.json && enc.json.result;
  if (!res || typeof res.data !== "string" || !res.data || !res.state) return { why: `şifreleme servisi cevap vermedi (${enc.status || "bağlantı yok"})` };

  // 2) ikili gövdeyi gönder, ikili cevabı al
  const body = new Uint8Array(b64decodeBytes(res.data));
  const raw = await timed(
    fetch(`${WING}/g`, { method: "POST", headers: Object.assign({ Accept: "*/*", "Content-Type": "application/octet-stream" }, CJ_HEADERS), body }).then(async (r) => {
      if (typeof r.arrayBuffer !== "function") return { status: r.status, nobin: true };
      const buf = await r.arrayBuffer();
      return { status: r.status, bytes: new Uint8Array(buf) };
    }),
    9000
  );
  if (!raw) return { why: "api.wing.st zaman aşımı" };
  if (raw.nobin) return { why: "bu Nuvio sürümü ikili veriyi desteklemiyor (uygulamayı güncelle)", fatal: true };
  if (raw.status < 200 || raw.status >= 300 || !raw.bytes || !raw.bytes.length) return { why: `api.wing.st HTTP ${raw.status}` };

  // 3) cevabı çöz
  const dec = await getJson(
    `${ENCDEC}/dec-cinejoy`,
    { method: "POST", headers: { "User-Agent": UA, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ text: bytesToB64url(raw.bytes), state: res.state }) },
    8000
  );
  const data = dec.json && dec.json.result && dec.json.result.data;
  if (!data) return { why: `çözme servisi cevap vermedi (${dec.status || "bağlantı yok"})` };
  if (!Array.isArray(data.stream)) return { why: data.error ? `yok (${String(data.error).slice(0, 40)})` : "liste yok" };
  return { playlists: data.stream.map((x) => x && x.playlist).filter((u) => typeof u === "string" && /^https?:/.test(u)) };
}

export async function getCinejoyStreams(tmdbId, mediaType, season, episode, diag) {
  const isTv = mediaType === "tv" || mediaType === "series";
  const s = parseInt(season, 10) || 1;
  const e = parseInt(episode, 10) || 1;
  const info = await trInfo(tmdbId, mediaType);
  const why = [];
  const out = [];

  for (let i = 0; i < SERVERS.length && !out.length; i++) {
    const server = SERVERS[i];
    const ans = await askServer(info, tmdbId, isTv, s, e, server);
    if (ans.why) {
      why.push(`${server}: ${ans.why}`);
      if (ans.fatal) break;
      continue;
    }
    for (const pl of ans.playlists.slice(0, 2)) {
      const r = await timed(
        fetch(pl, { headers: Object.assign({ Accept: "*/*" }, CJ_HEADERS) }).then(async (x) => ({ status: x.status, text: await x.text() })),
        6000
      );
      if (!r || !/#EXTM3U/.test(r.text)) {
        why.push(`${server}: liste açılmadı (${r ? r.status : "zaman aşımı"})`);
        continue;
      }
      const m = parseMaster(r.text, pl);
      const top = m.variants[0];
      if (!top) {
        why.push(`${server}: master değil`);
        continue;
      }
      const audio = audioNames(m.audios);
      const lines = [`✅ Doğrulandı: ${resLabel(top)}${m.variants.length > 1 ? ` (+ ${m.variants.slice(1).map((v) => v.h + "p").join(", ")})` : ""}`];
      if (/HDR10/.test(videoTags(top))) lines.push("🌈 HDR10 · HDR destekli ekranda en iyi görünür");
      out.push({
        url: pl,
        quality: qualityOfVariant(top),
        type: "direct",
        source: "cinejoy",
        server,
        format: "HLS",
        extraTags: videoTags(top),
        lang: audio || undefined,
        mbps: mbpsOf(top) || undefined,
        note: lines.join("\n"),
        headers: Object.assign({}, CJ_HEADERS),
      });
    }
  }

  if (!out.length) {
    diag && diag.fail(why.slice(-2).join(" · ") || "link yok");
    return [];
  }
  diag && diag.step(`${out[0].server}: ${out.map((x) => x.quality).join(", ")}`);
  return out;
}
