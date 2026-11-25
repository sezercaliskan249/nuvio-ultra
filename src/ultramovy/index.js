/** Ultra Movy — Movy (movy.sx) HLS, up to 4K, one card per verified quality. */
import { makeGetStreams } from "../ultra/core.js";
import { getMovyStreams } from "../ultra/sources/movy.js";

module.exports = { getStreams: makeGetStreams({ Movy: getMovyStreams }, "Ultra Movy") };
