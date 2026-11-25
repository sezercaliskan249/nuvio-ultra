/** Ultra HD — Vidlink + VidRock: fast 1080p / 720p MP4 + HLS. */
import { makeGetStreams } from "../ultra/core.js";
import { getVidlinkStreams } from "../ultra/sources/vidlink.js";
import { getVidrockStreams } from "../ultra/sources/vidrock.js";

module.exports = { getStreams: makeGetStreams({ Vidlink: getVidlinkStreams, VidRock: getVidrockStreams }, "Ultra HD") };
