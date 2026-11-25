/**
 * M3U8 (HLS) ayrıştırıcı
 * Master playlist içindeki kaliteleri (720p / 1080p / 4K) ayrı stream'ler yapar
 */

function resolveUrl(url, baseUrl) {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  try {
    return new URL(url, baseUrl).toString();
  } catch (e) {
    return url;
  }
}

export function qualityFromResolution(resolution) {
  if (!resolution) return "Auto";
  const parts = resolution.split("x").map(Number);
  // Sinema filmleri geniş ekran (ör. 3840x1608 = 4K, 1920x800 = 1080p): yükseklik tek başına
  // yanıltır. Genişliği 16:9 karşılığına çevirip ikisinden büyüğünü kullan.
  const height = Math.max(parts[1] || 0, Math.round(((parts[0] || 0) * 9) / 16 / 10) * 10);
  if (height >= 2160) return "4K";
  if (height >= 1440) return "1440p";
  if (height >= 1080) return "1080p";
  if (height >= 720) return "720p";
  if (height >= 480) return "480p";
  if (height >= 360) return "360p";
  return "240p";
}

export function qualityPriority(q) {
  const map = { "4K": 5, "1440p": 4, "1080p": 3, "720p": 2, "480p": 1, "360p": 0.5, "Auto": 0 };
  return map[q] !== undefined ? map[q] : 0;
}

/**
 * M3U8 içeriğini parse eder -> [{ bandwidth, resolution, url, quality }]
 */
export function parseM3U8(content, baseUrl) {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const streams = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("#EXT-X-STREAM-INF:")) {
      current = { bandwidth: null, resolution: null, url: null };
      const bw = line.match(/BANDWIDTH=(\d+)/);
      if (bw) current.bandwidth = parseInt(bw[1], 10);
      const res = line.match(/RESOLUTION=(\d+x\d+)/);
      if (res) current.resolution = res[1];
    } else if (current && !line.startsWith("#")) {
      current.url = resolveUrl(line, baseUrl);
      current.quality = qualityFromResolution(current.resolution);
      streams.push(current);
      current = null;
    }
  }
  return streams;
}
