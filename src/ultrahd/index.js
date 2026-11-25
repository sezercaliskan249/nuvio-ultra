/**
 * Ultra HD — Vidlink + VidRock: 1080p / 720p MP4 ve HLS. Hızlı.
 * Kod src/ultra/ altında; bu dosya sadece hangi kaynakların çalışacağını seçer.
 */
import { makeGetStreams } from "../ultra/core.js";
module.exports = { getStreams: makeGetStreams(["Vidlink", "VidRock"], "Ultra HD") };
