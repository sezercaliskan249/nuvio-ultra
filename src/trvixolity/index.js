/** Ultra Vixolity — Turkish dubbed + Turkish subtitled movies & TV series (1080p HLS). */
import { makeGetStreams } from "../ultra/core.js";
import { getVixolityStreams } from "../ultra/sources/vixolity.js";

module.exports = { getStreams: makeGetStreams({ Vixolity: getVixolityStreams }, "Ultra Vixolity") };
