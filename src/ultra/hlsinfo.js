/**
 * HLS master listesinden kart bilgisi: çözünürlükler, codec, HDR, bit hızı, ses dilleri, altyazılar.
 * (URL çözümlemede `URL` sınıfı kullanılmaz — Nuvio'nun JS motorunda güvenilir değil.)
 */

const LANGS = {
  en: "İngilizce", eng: "İngilizce", tr: "Türkçe", tur: "Türkçe", hi: "Hintçe", hin: "Hintçe",
  pt: "Portekizce", por: "Portekizce", es: "İspanyolca", spa: "İspanyolca", fr: "Fransızca", fre: "Fransızca", fra: "Fransızca",
  de: "Almanca", ger: "Almanca", deu: "Almanca", it: "İtalyanca", ita: "İtalyanca", ja: "Japonca", jpn: "Japonca",
  ko: "Korece", kor: "Korece", ru: "Rusça", rus: "Rusça", ar: "Arapça", ara: "Arapça", ta: "Tamil", tam: "Tamil", te: "Telugu", tel: "Telugu",
  pl: "Lehçe", pol: "Lehçe", nl: "Felemenkçe", dut: "Felemenkçe", nld: "Felemenkçe", zh: "Çince", chi: "Çince", zho: "Çince",
};

function attr(line, name) {
  const m = line.match(new RegExp("[:,]" + name + '=(?:"([^"]*)"|([^,]*))'));
  return m ? (m[1] != null ? m[1] : m[2]) : "";
}

export function absUri(u, base) {
  if (/^https?:\/\//i.test(u)) return u;
  const origin = (base.match(/^https?:\/\/[^/]+/i) || [""])[0];
  if (u.charAt(0) === "/") return origin + u;
  return base.split("?")[0].replace(/[^/]*$/, "") + u;
}

export function langName(code, fallback) {
  const c = String(code || "").toLowerCase();
  return LANGS[c] || fallback || code || "";
}

/** master metni -> { variants:[{w,h,bw,avg,codecs,range,url}], audios:[{lang,name}], subs:[...] } (yüksekten düşüğe) */
export function parseMaster(text, baseUrl) {
  const variants = [];
  const audios = [];
  const subs = [];
  const lines = String(text || "").split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^#EXT-X-MEDIA:/.test(l)) {
      const type = attr(l, "TYPE");
      const item = { lang: attr(l, "LANGUAGE").toLowerCase(), name: attr(l, "NAME") };
      if (type === "AUDIO") audios.push(item);
      else if (type === "SUBTITLES") subs.push(item);
    } else if (/^#EXT-X-STREAM-INF:/.test(l)) {
      const res = attr(l, "RESOLUTION").match(/(\d+)x(\d+)/);
      let uri = "";
      for (let j = i + 1; j < lines.length; j++) {
        const n = lines[j].trim();
        if (!n) continue;
        if (n.charAt(0) !== "#") uri = n;
        break;
      }
      variants.push({
        w: res ? parseInt(res[1], 10) : 0,
        h: res ? parseInt(res[2], 10) : 0,
        bw: parseInt(attr(l, "BANDWIDTH"), 10) || 0,
        avg: parseInt(attr(l, "AVERAGE-BANDWIDTH"), 10) || 0,
        codecs: attr(l, "CODECS"),
        range: attr(l, "VIDEO-RANGE"),
        url: uri ? absUri(uri, baseUrl || "") : "",
      });
    }
  }
  variants.sort((a, b) => b.h - a.h || b.bw - a.bw);
  return { variants, audios, subs };
}

/** 1920x800 gibi sinema oranlarında genişliğe de bakar */
export function qualityOfVariant(v) {
  if (!v) return "Auto";
  const h = Math.max(v.h, Math.round((v.w * 9) / 16));
  if (h >= 2000) return "4K";
  if (h >= 1400) return "1440p";
  if (h >= 1000) return "1080p";
  if (h >= 700) return "720p";
  if (h >= 470) return "480p";
  return h ? "360p" : "Auto";
}

/** codec/HDR etiketleri (format.js parseRelease'in anladığı biçimde) */
export function videoTags(v) {
  if (!v) return "";
  const t = [];
  if (/^(hvc1|hev1)/i.test(v.codecs)) t.push("HEVC");
  else if (/^avc1/i.test(v.codecs)) t.push("H.264");
  else if (/^av01/i.test(v.codecs)) t.push("AV1");
  if (/^PQ$/i.test(v.range)) t.push("HDR10");
  else if (/^HLG$/i.test(v.range)) t.push("HDR");
  if (/^(hvc1|hev1)\.2\./i.test(v.codecs)) t.push("10bit");
  return t.join(" ");
}

export function mbpsOf(v) {
  if (!v) return 0;
  const m = Math.round((v.avg || v.bw) / 1e6) || 0;
  return m >= 2 ? m : 0; // 1080p için <2 Mbps etiketi güvenilmez -> gösterme
}

/** ses dilleri -> "İngilizce + Portekizce" (tekrarsız) */
export function audioNames(audios) {
  const seen = {};
  const out = [];
  audios.forEach((a) => {
    const n = langName(a.lang, String(a.name || "").replace(/^\d+\.\s*/, "").replace(/\s*\d\.\d$/, ""));
    const k = n.toLowerCase();
    if (n && !seen[k]) {
      seen[k] = true;
      out.push(n);
    }
  });
  // Kart taşmasın: Türkçe varsa öne al, en fazla 4 dil + "+N"
  const tr = out.indexOf("Türkçe");
  if (tr > 0) out.unshift(out.splice(tr, 1)[0]);
  return out.length > 4 ? out.slice(0, 4).join(" + ") + ` +${out.length - 4}` : out.join(" + ");
}

export function resLabel(v) {
  return v && v.w ? `${v.w}×${v.h}` : "";
}
