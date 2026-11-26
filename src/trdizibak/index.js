/** Ultra DiziBak — TV series with burned-in Turkish subtitles (720p HLS). */
import { makeGetStreams } from "../ultra/core.js";
import { getDiziBakStreams } from "../ultra/sources/dizibak.js";

module.exports = { getStreams: makeGetStreams({ DiziBak: getDiziBakStreams }, "Ultra DiziBak") };
