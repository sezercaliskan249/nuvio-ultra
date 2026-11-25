/** Ultra 4K — 4KHDHub + MoviesDrive: 4K / 1080p MKV (REMUX, DV, HDR). */
import { makeGetStreams } from "../ultra/core.js";
import { get4KHDHubStreams } from "../ultra/sources/fourkhdhub.js";
import { getMoviesDriveStreams } from "../ultra/sources/moviesdrive.js";

module.exports = { getStreams: makeGetStreams({ "4KHDHub": get4KHDHubStreams, MoviesDrive: getMoviesDriveStreams }, "Ultra 4K") };
