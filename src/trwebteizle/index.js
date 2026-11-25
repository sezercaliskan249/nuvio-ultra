/** Ultra Webteizle — Turkish dubbed / subtitled movies. */
import { makeGetStreams } from "../ultra/core.js";
import { getWebteizleStreams } from "../ultra/sources/webteizle.js";

module.exports = { getStreams: makeGetStreams({ Webteizle: getWebteizleStreams }, "Ultra Webteizle") };
