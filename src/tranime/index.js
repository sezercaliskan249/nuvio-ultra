/** Ultra Anime — anime with burned-in Turkish subtitles (DiziWatch / AnizmPlayer, up to 1080p HLS). */
import { makeGetStreams } from "../ultra/core.js";
import { getDiziWatchStreams } from "../ultra/sources/diziwatch.js";

// Nuvio "Test" butonu 603 (Matrix) gönderir -> anime eklentisi Frieren S1E1 ile dener
module.exports = { getStreams: makeGetStreams({ DiziWatch: getDiziWatchStreams }, "Ultra Anime", { testTv: "209867" }) };
