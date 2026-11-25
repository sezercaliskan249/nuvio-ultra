/**
 * HTTP yardımcıları - Nuvio Hermes uyumlu
 * fetch tabanlı, timeout + yönlendirme çözme yardımcıları
 */

export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

export const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  "Accept": "application/json,text/html,*/*",
  "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
};

/**
 * Bir promise'i süre sınırıyla çalıştırır; süre dolarsa fallback döner.
 */
export function withTimeout(promise, ms, fallback) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(fallback);
      }
    }, ms);
    Promise.resolve(promise).then(
      (v) => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(v);
        }
      },
      () => {
        if (!done) {
          done = true;
          clearTimeout(timer);
          resolve(fallback);
        }
      }
    );
  });
}

/**
 * GET isteği yapar, response döner (HTTP hata kodunda throw eder)
 */
export async function makeRequest(url, options = {}) {
  const headers = { ...DEFAULT_HEADERS, ...(options.headers || {}) };
  const response = await fetch(url, {
    ...options,
    method: options.method || "GET",
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${url}`);
  }
  return response;
}

export async function fetchText(url, options = {}) {
  const res = await makeRequest(url, options);
  return await res.text();
}

export async function fetchJson(url, options = {}) {
  const res = await makeRequest(url, options);
  return await res.json();
}

/**
 * Hata fırlatmayan metin çekici (null döner)
 */
export async function safeText(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

/**
 * Yönlendirmeleri takip edip son URL'yi döner (HEAD ile, gövde indirmeden)
 */
export async function resolveFinalUrl(url, headers = {}) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT, ...headers },
    });
    return res.url || url;
  } catch (e) {
    return null;
  }
}

/**
 * Linkin gerçekten video döndürüp döndürmediğini 1 byte'lık Range isteğiyle kontrol eder.
 * (Kotası dolmuş Google Drive / "Generate Link Again" veren worker linklerini ayıklar)
 *
 * GÜVENLİK: React Native fetch'i gövde tamamen inmeden resolve etmez. Range'i yok sayan
 * bir sunucu 30 GB'lık dosyayı göndermeye başlarsa diye istek `ms` sonra iptal edilir
 * ve link "muhtemelen çalışıyor" kabul edilir (hızlı 4xx = kesin ölü).
 */
// Range isteğine uyduğu doğrulanmış hostlar (1 byte döner). Diğerlerinde (ör. Google CDN)
// Nuvio'nun fetch köprüsü 16 MB'a kadar indirip JS'e aktarır -> ÇOK yavaş. Onları test etme.
const RANGE_SAFE_HOSTS = /(\.workers\.dev|r2\.cloudflarestorage\.com|\.r2\.dev)(\/|:|$)/i;

export function canProbe(url) {
  const m = String(url).match(/^https?:\/\/([^/?#]+)/i);
  return !!(m && RANGE_SAFE_HOSTS.test(m[1] + "/"));
}

export function isPlayable(url, headers = {}, ms = 4000) {
  if (!canProbe(url)) return Promise.resolve(true);
  return new Promise((resolve) => {
    let done = false;
    const finish = (v) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(() => {
      if (ac) {
        try {
          ac.abort();
        } catch (e) {}
      }
      finish(true);
    }, ms);
    const opts = {
      method: "GET",
      headers: { "User-Agent": "ExoPlayerLib/2.19.1", Range: "bytes=0-0", ...headers },
    };
    if (ac) opts.signal = ac.signal;
    fetch(url, opts)
      .then((res) => {
        clearTimeout(timer);
        if (res.status !== 200 && res.status !== 206) return finish(false);
        const ct = (res.headers && res.headers.get && res.headers.get("content-type")) || "";
        finish(!/text\/html|application\/json|text\/plain/i.test(ct));
        try {
          if (res.body && res.body.cancel) res.body.cancel();
        } catch (e) {}
      })
      .catch(() => {
        clearTimeout(timer);
        finish(done ? true : false);
      });
  });
}

/**
 * Kararlılık testi: worker linkleri arkada birkaç Google Drive hesabı arasında döner.
 * Bazı hesapların kotası dolunca AYNI link bir istekte 206, diğerinde 403 verir ->
 * oynatıcı film ortasında 403'e denk gelip DONAR. 3 isteği aynı anda atıp kaçının
 * başarılı olduğunu sayarız: 3/3 = kararlı, 1-2/3 = kararsız (donabilir), 0 = ölü.
 */
export function probeStability(url, ms = 3500, tries = 3) {
  if (!canProbe(url)) return Promise.resolve(-1); // test edilemez
  const all = [];
  for (let i = 0; i < tries; i++) all.push(isPlayable(url, {}, ms));
  return Promise.all(all).then((r) => r.filter(Boolean).length);
}

/**
 * URL içindeki boşluk vb. karakterleri güvenli hale getirir
 */
export function safeUrl(url) {
  if (!url) return url;
  if (/[\s\[\]]/.test(url)) {
    try {
      return encodeURI(decodeURI(url));
    } catch (e) {
      return url.replace(/ /g, "%20");
    }
  }
  return url;
}
