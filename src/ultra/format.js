/**
 * Ortak görünüm / etiket tasarımı
 *
 * Tüm kaynaklar ham bilgiyi verir (source, quality, kind, size, seeds, tracker,
 * fileName...). Nuvio'da görünen "name" (başlık) ve "title" (alt başlık) burada
 * tek tip, düzenli ve okunaklı biçimde üretilir.
 *
 *  BAŞLIK (name)  : kısa — tür ikonu + kalite + rozet      ör. "⚡ 4K  ·  DV HDR"
 *  ALT BAŞLIK     : satır satır bilgi
 *     📡 Sağlayıcı  ›  bağlantı türü
 *     🎞 Kaynak / görüntü etiketleri
 *     🔊 Ses   ·   💾 Boyut   (torrentte 🌱 seed sağlığı)
 *     📄 Dosya adı (kısaltılmış)
 */

const SEP = "  ·  ";

// --- Sağlayıcı görünen adları ----------------------------------------------
const PROVIDER_NAMES = {
  "4khdhub": "4KHDHub",
  moviesdrive: "MoviesDrive",
  vidlink: "Vidlink",
  vidrock: "VidRock",
  vixsrc: "Vixsrc",
  torrentio: "Torrentio",
  filmmodu: "FilmModu",
  webteizle: "Webteizle",
  sezonlukdizi: "SezonlukDizi",
  "111477": "111477 Arşiv",
  movy: "Movy",
};

// Torrent sitelerinin düzgün yazımları
const TRACKER_NAMES = {
  thepiratebay: "The Pirate Bay",
  "1337x": "1337x",
  yts: "YTS",
  eztv: "EZTV",
  rarbg: "RARBG",
  torrentgalaxy: "TorrentGalaxy",
  rutracker: "RuTracker",
  rutor: "Rutor",
  kickasstorrents: "KickassTorrents",
  magnetdl: "MagnetDL",
  horriblesubs: "HorribleSubs",
  nyaasi: "Nyaa",
  tokyotosho: "TokyoTosho",
  anidex: "AniDex",
  ext: "EXT.to",
  torrent9: "Torrent9",
  ilcorsaronero: "ilCorSaRoNeRo",
  mejortorrent: "MejorTorrent",
  wolfmax4k: "Wolfmax4K",
  cinecalidad: "Cinecalidad",
  besttorrents: "BestTorrents",
  bitsearch: "BitSearch",
};

// --- Bağlantı türü etiketleri ----------------------------------------------
function linkTypeLabel(s) {
  if (s.flaky) return "⚠️ Kararsız sunucu  ·  Donabilir";
  switch (s.kind) {
    case "R2":
      return "⚡ Direkt  ·  Sarılabilir";
    case "FSL":
      return "⚡ FSL  ·  Sarılabilir";
    case "S3":
      return "⚡ S3  ·  Sarılabilir";
    case "PIXEL":
      return s.bytes > 15e9 ? "🚀 Google CDN  ·  ⚠️ Sarma yok, takılabilir" : "🚀 Google CDN  ·  Sarma sınırlı";
    case "ZIPDISK":
      return "☁️ ZipDisk";
  }
  if (s.source === "111477") return "📦 Dev arşiv  ·  Sarılabilir";
  if (s.source === "movy") return `${s.format === "DASH" ? "📺 DASH" : s.format === "MP4" ? "🎯 MP4" : "📺 HLS"}  ·  Sunucu ${s.server || "?"}`;
  if (s.source === "vidlink") return "🎯 MP4  ·  Sarılabilir";
  if (s.source === "vidrock") return `📺 HLS  ·  Sunucu ${s.server || "?"}`;
  if (s.source === "vixsrc") return "📺 HLS";
  return "🔗 Direkt";
}

// --- Dosya adından etiket çıkarma -------------------------------------------
export function parseRelease(text) {
  const t = String(text || "");
  const source = /remux/i.test(t)
    ? "REMUX"
    : /blu-?ray|bdrip|brrip/i.test(t)
    ? "BluRay"
    : /web-?dl/i.test(t)
    ? "WEB-DL"
    : /webrip/i.test(t)
    ? "WEBRip"
    : /hdtv/i.test(t)
    ? "HDTV"
    : /\b(cam|hdcam|ts|telesync)\b/i.test(t)
    ? "CAM"
    : "";

  const video = [];
  if (/\bDV\b|dolby.?vision|\bDoVi\b/i.test(t)) video.push("Dolby Vision");
  if (/HDR10\+|HDR10plus/i.test(t)) video.push("HDR10+");
  else if (/\bHDR(10)?\b/i.test(t)) video.push("HDR");
  if (/x265|hevc|h\.?265/i.test(t)) video.push("HEVC");
  else if (/x264|avc|h\.?264/i.test(t)) video.push("H.264");
  else if (/\bav1\b/i.test(t)) video.push("AV1");
  if (/10.?bit/i.test(t)) video.push("10bit");
  if (/\bIMAX\b/i.test(t)) video.push("IMAX");

  const audio = [];
  if (/truehd/i.test(t)) audio.push("TrueHD");
  else if (/DTS[-.\s]?HD|DTS[-.\s]?MA/i.test(t)) audio.push("DTS-HD MA");
  else if (/DTS/i.test(t)) audio.push("DTS");
  else if (/DDP|DD\+|E-?AC-?3/i.test(t)) audio.push("Dolby Digital+");
  else if (/AC-?3|\bDD\b/i.test(t)) audio.push("Dolby Digital");
  else if (/AAC/i.test(t)) audio.push("AAC");
  if (/atmos/i.test(t)) audio.push("Atmos");
  // En yüksek kanal sayısı (ör. "DDP5.1 ... TrueHD 7.1" -> 7.1)
  let best = null;
  const chRe = /(?:^|[^0-9])([2578])[ .]([01])(?![0-9])/g;
  let m;
  while ((m = chRe.exec(t)) !== null) {
    const v = parseFloat(m[1] + "." + m[2]);
    if (best === null || v > best) best = v;
  }
  if (best !== null) audio.push(best.toFixed(1));

  const langs = [];
  if (/english|\beng\b/i.test(t)) langs.push("İngilizce");
  if (/turkish|türkçe|\btur\b/i.test(t)) langs.push("Türkçe");
  if (/hindi/i.test(t)) langs.push("Hintçe");
  if (/tamil/i.test(t)) langs.push("Tamil");
  if (/telugu/i.test(t)) langs.push("Telugu");
  if (/multi/i.test(t) && langs.length === 0) langs.push("Çoklu dil");
  if (/dual.?audio/i.test(t) && langs.length === 0) langs.push("Çift ses");

  return { source, video, audio, langs };
}

// Başlık rozeti: en önemli görüntü özelliği
function badge(rel) {
  const b = [];
  if (rel.source === "REMUX") b.push("REMUX");
  if (rel.video.indexOf("Dolby Vision") !== -1) b.push("DV");
  if (rel.video.indexOf("HDR10+") !== -1) b.push("HDR10+");
  else if (rel.video.indexOf("HDR") !== -1) b.push("HDR");
  return b.join(" ");
}

function shortFile(name, max) {
  const n = String(name || "")
    .replace(/\[[^\]]*\.(com|net|org|in|xyz)[^\]]*\]/gi, "") // [site.com] reklamlarını at
    .replace(/^[-\s.]+/, "")
    .replace(/\s+/g, " ")
    .trim();
  if (n.length <= max) return n;
  return n.slice(0, max - 1).trim() + "…";
}

function seedHealth(seeds) {
  if (seeds >= 100) return `🟢 ${seeds} seed  ·  Çok hızlı`;
  if (seeds >= 30) return `🟢 ${seeds} seed  ·  Hızlı`;
  if (seeds >= 10) return `🟡 ${seeds} seed  ·  Orta`;
  if (seeds > 0) return `🔴 ${seeds} seed  ·  Yavaş`;
  return "⚪ Seed bilgisi yok";
}

// Ortalama bit hızı; sahnelere göre anlık ~1.5-2 katına çıkar.
// Eşikler 100 Mbps ev hattı + telefonda Wi-Fi (gerçekte ~50-80 Mbps) için.
function speedLine(mbps) {
  if (mbps <= 25) return `📶 ~${mbps} Mbps gerekir  ·  🟢 Rahat akar`;
  if (mbps <= 45) return `📶 ~${mbps} Mbps gerekir  ·  🟡 İyi Wi-Fi ister`;
  return `📶 ~${mbps} Mbps gerekir  ·  🔴 Akış için çok ağır`;
}

function prettyTracker(raw) {
  if (!raw) return "";
  const key = String(raw).toLowerCase().replace(/[^a-z0-9]/g, "");
  return TRACKER_NAMES[key] || raw;
}

// --- Ana biçimlendirici -----------------------------------------------------
// Türk siteleri: dublaj / altyazı vurgulu kart
function formatTr(s) {
  const q = s.quality || "Auto";
  const dub = s.tr === "dublaj";
  const name = (dub ? "🇹🇷 " : "💬 ") + (q === "Auto" ? "HD" : q) + SEP + (dub ? "Türkçe Dublaj" : "Türkçe Altyazılı");
  const provider = PROVIDER_NAMES[s.source] || s.source || "";
  const lines = [];
  const l1 = [`📡 ${provider}`];
  l1.push(s.format === "MP4" ? "🎯 MP4" : "📺 HLS");
  if (s.host && s.host !== provider) l1.push(`Sunucu ${s.host}`);
  lines.push(l1.join(SEP));
  if (dub) lines.push("🔊 Türkçe ses");
  else if (s.subtitles && s.subtitles.length) lines.push("💬 Türkçe altyazı dosyası otomatik eklenir");
  else lines.push("💬 Altyazı videoya gömülü");
  return { name, title: lines.join("\n") };
}

export function formatStream(s) {
  if (s.tr) return formatTr(s);
  const isTorrent = s.type === "torrent";
  const q = s.quality || "Auto";
  const rel = parseRelease((s.fileName || "") + " " + (s.extraTags || ""));
  const b = badge(rel);

  // BAŞLIK
  const icon = isTorrent ? "🧲" : "⚡";
  const name = `${icon} ${q}` + (b ? `${SEP}${b}` : "");

  // ALT BAŞLIK
  const lines = [];
  const provider = PROVIDER_NAMES[s.source] || s.source || "";

  if (isTorrent) {
    const tr = prettyTracker(s.tracker);
    lines.push(`📡 ${tr || "Torrent"}${SEP}🧲 Torrent`);
    const l2 = [seedHealth(s.seeds || 0)];
    if (s.size) l2.push(`💾 ${s.size}`);
    lines.push(l2.join(SEP));
  } else {
    lines.push(`📡 ${provider}${SEP}${linkTypeLabel(s)}`);
  }

  const vid = [];
  if (rel.source && rel.source !== "REMUX") vid.push(rel.source);
  if (rel.source === "REMUX") vid.push("REMUX");
  rel.video.forEach((v) => vid.push(v));
  if (vid.length) lines.push(`🎞 ${vid.join(" · ")}`);

  const l3 = [];
  const audio = [];
  if (s.flags) {
    audio.push(
      s.flags
        .replace(/multi\s*audio/i, "Çoklu ses")
        .replace(/dual\s*audio/i, "Çift ses")
        .replace(/\s*\/\s*/g, " ")
        .trim()
    );
  }
  else if (rel.langs.length) audio.push(rel.langs.join(" + "));
  else if (s.lang) audio.push(s.lang);
  if (rel.audio.length) audio.push(rel.audio.join(" · "));
  if (audio.length) l3.push(`🔊 ${audio.join(" · ")}`);
  if (!isTorrent && s.size) l3.push(`💾 ${s.size}`);
  if (l3.length) lines.push(l3.join(SEP));
  if (!isTorrent && s.mbps) lines.push(speedLine(s.mbps));

  if (s.note) lines.push(s.note);
  if (s.fileName) lines.push(`📄 ${shortFile(s.fileName, 70)}`);

  return { name, title: lines.join("\n") };
}
