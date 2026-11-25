/**
 * Ultra 4K — 4KHDHub + MoviesDrive: 4K / 1080p MKV (REMUX, DV, HDR). En kaliteli ama en yavaş kısım.
 * Kod src/ultra/ altında; bu dosya sadece hangi kaynakların çalışacağını seçer.
 */
import { makeGetStreams } from "../ultra/core.js";
module.exports = { getStreams: makeGetStreams(["4KHDHub", "MoviesDrive"], "Ultra 4K") };
