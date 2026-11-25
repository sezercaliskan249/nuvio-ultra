/** Ultra Archive — 111477 open archive (mostly 4K / REMUX). Requires a residential IP (no VPN). */
import { makeGetStreams } from "../ultra/core.js";
import { get111477Streams } from "../ultra/sources/s111477.js";

module.exports = { getStreams: makeGetStreams({ "111477": get111477Streams }, "Ultra Archive") };
