/**
 * Ultra Torrent — Torrentio: 4K / 1080p / 720p torrentler. Çok hızlı.
 * Kod src/ultra/ altında; bu dosya sadece hangi kaynakların çalışacağını seçer.
 */
import { makeGetStreams } from "../ultra/core.js";
module.exports = { getStreams: makeGetStreams(["Torrentio"], "Ultra Torrent") };
