/** Ultra Arşiv — 111477: 1.4 PB'lık açık arşiv (çoğu 4K / REMUX). VPN kapalı olmalı. */
import { makeGetStreams } from "../ultra/core.js";
module.exports = { getStreams: makeGetStreams(["111477"], "Ultra Arşiv") };
