/**
 * Ultra Stream (hepsi bir arada) — eski tek-eklenti sürümü, uyumluluk için duruyor.
 * Yeni manifest 3 ayrı eklenti kullanır (ultra4k / ultrahd / ultratorrent) ki
 * hızlı kaynaklar yavaşları beklemeden ekrana gelsin.
 */
import { makeGetStreams } from "./core.js";
module.exports = { getStreams: makeGetStreams(null, "Ultra") };
